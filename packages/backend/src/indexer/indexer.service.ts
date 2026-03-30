import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { RedisService } from '../redis/redis.service';
import { IndexedEvent } from './entities/indexed-event.entity';
import { Settlement } from './entities/settlement.entity';

const BATCH_SETTLED_EVENT = parseAbiItem(
  'event BatchSettled(uint256 indexed batchId, uint256 clearingPrice, uint256 matchedVolume, uint256 protocolFee)',
);
const ORDER_SUBMITTED_EVENT = parseAbiItem(
  'event OrderSubmitted(bytes32 indexed orderId, address indexed trader, uint256 escrowAmount)',
);
const ORDER_CANCELLED_EVENT = parseAbiItem(
  'event OrderCancelled(bytes32 indexed orderId, address indexed trader)',
);
const ORDER_FILLED_EVENT = parseAbiItem(
  'event OrderFilled(bytes32 indexed orderId, uint256 clearingPrice, uint256 batchId)',
);

const CURSOR_KEY = 'adp:indexer:lastBlock';
const BUFFER_FLUSH_INTERVAL = 5000; // 5 seconds

@Injectable()
export class IndexerService implements OnModuleInit {
  private readonly logger = new Logger(IndexerService.name);
  private eventBuffer: Partial<IndexedEvent>[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(
    private config: ConfigService,
    private redis: RedisService,
    @InjectRepository(IndexedEvent) private eventRepo: Repository<IndexedEvent>,
    @InjectRepository(Settlement) private settlementRepo: Repository<Settlement>,
  ) {}

  async onModuleInit() {
    const darkPoolAddress = this.config.get<string>('DARKPOOL_ADDRESS');
    if (!darkPoolAddress) {
      this.logger.warn('DARKPOOL_ADDRESS not set — indexer disabled');
      return;
    }

    this.startFlushTimer();
    await this.startWatching();
  }

  private async startWatching() {
    const rpcUrl = this.config.get<string>('BASE_SEPOLIA_RPC', 'https://sepolia.base.org');
    const isMainnet = this.config.get<string>('NODE_ENV') === 'production';

    const client = createPublicClient({
      chain: isMainnet ? base : baseSepolia,
      transport: http(rpcUrl),
    });

    const darkPoolAddress = this.config.get<string>('DARKPOOL_ADDRESS') as `0x${string}`;

    // Watch BatchSettled events
    client.watchEvent({
      address: darkPoolAddress,
      event: BATCH_SETTLED_EVENT,
      onLogs: (logs) => {
        for (const log of logs) {
          this.bufferEvent({
            blockNumber: log.blockNumber?.toString() ?? '0',
            txHash: log.transactionHash ?? '',
            logIndex: log.logIndex ?? 0,
            contractAddress: darkPoolAddress,
            eventName: 'BatchSettled',
            args: {
              batchId: log.args.batchId?.toString(),
              clearingPrice: log.args.clearingPrice?.toString(),
              matchedVolume: log.args.matchedVolume?.toString(),
              protocolFee: log.args.protocolFee?.toString(),
            },
          });

          // Also create a settlement record
          this.handleBatchSettled(log);

          // Publish to Redis for WebSocket
          this.redis.publish(
            'adp:events:settlement',
            JSON.stringify({
              batchId: Number(log.args.batchId),
              clearingPrice: log.args.clearingPrice?.toString(),
              matchedVolume: log.args.matchedVolume?.toString(),
              txHash: log.transactionHash,
              timestamp: Date.now(),
            }),
          );
        }
      },
    });

    // Watch OrderSubmitted events
    client.watchEvent({
      address: darkPoolAddress,
      event: ORDER_SUBMITTED_EVENT,
      onLogs: (logs) => {
        for (const log of logs) {
          this.bufferEvent({
            blockNumber: log.blockNumber?.toString() ?? '0',
            txHash: log.transactionHash ?? '',
            logIndex: log.logIndex ?? 0,
            contractAddress: darkPoolAddress,
            eventName: 'OrderSubmitted',
            args: {
              orderId: log.args.orderId,
              trader: log.args.trader,
              escrowAmount: log.args.escrowAmount?.toString(),
            },
          });
        }
      },
    });

    // Watch OrderCancelled events
    client.watchEvent({
      address: darkPoolAddress,
      event: ORDER_CANCELLED_EVENT,
      onLogs: (logs) => {
        for (const log of logs) {
          this.bufferEvent({
            blockNumber: log.blockNumber?.toString() ?? '0',
            txHash: log.transactionHash ?? '',
            logIndex: log.logIndex ?? 0,
            contractAddress: darkPoolAddress,
            eventName: 'OrderCancelled',
            args: {
              orderId: log.args.orderId,
              trader: log.args.trader,
            },
          });
        }
      },
    });

    // Watch OrderFilled events
    client.watchEvent({
      address: darkPoolAddress,
      event: ORDER_FILLED_EVENT,
      onLogs: (logs) => {
        for (const log of logs) {
          this.bufferEvent({
            blockNumber: log.blockNumber?.toString() ?? '0',
            txHash: log.transactionHash ?? '',
            logIndex: log.logIndex ?? 0,
            contractAddress: darkPoolAddress,
            eventName: 'OrderFilled',
            args: {
              orderId: log.args.orderId,
              clearingPrice: log.args.clearingPrice?.toString(),
              batchId: log.args.batchId?.toString(),
            },
          });
        }
      },
    });

    this.logger.log(`Indexer watching DarkPool at ${darkPoolAddress}`);
  }

  private bufferEvent(event: Partial<IndexedEvent>) {
    this.eventBuffer.push(event);
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => this.flushBuffer(), BUFFER_FLUSH_INTERVAL);
  }

  private async flushBuffer() {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      await this.eventRepo.save(events);

      // Update block cursor
      const maxBlock = events.reduce(
        (max, e) => (BigInt(e.blockNumber ?? '0') > BigInt(max) ? (e.blockNumber ?? '0') : max),
        '0',
      );
      await this.redis.set(CURSOR_KEY, maxBlock);

      this.logger.debug(`Flushed ${events.length} events (block ${maxBlock})`);
    } catch (err) {
      this.logger.error(`Failed to flush events: ${err}`);
      // Re-add to buffer for retry
      this.eventBuffer.unshift(...events);
    }
  }

  private async handleBatchSettled(log: {
    args: {
      batchId?: bigint;
      clearingPrice?: bigint;
      matchedVolume?: bigint;
      protocolFee?: bigint;
    };
    transactionHash?: string;
    blockNumber?: bigint;
  }) {
    try {
      const settlement = this.settlementRepo.create({
        batchId: Number(log.args.batchId),
        clearingPrice: log.args.clearingPrice?.toString() ?? '0',
        totalVolume: log.args.matchedVolume?.toString() ?? '0',
        numFills: 0, // Updated separately
        protocolFee: log.args.protocolFee?.toString() ?? '0',
        txHash: log.transactionHash ?? null,
        blockNumber: log.blockNumber?.toString() ?? null,
        settledAt: new Date(),
      });
      await this.settlementRepo.save(settlement);
    } catch (err) {
      this.logger.error(`Failed to save settlement: ${err}`);
    }
  }
}
