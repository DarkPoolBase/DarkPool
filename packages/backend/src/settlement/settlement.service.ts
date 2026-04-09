import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../orders/orders.service';
import { RedisService } from '../redis/redis.service';
import { Settlement } from '../indexer/entities/settlement.entity';
import { BatchResult } from '../matching/matching.service';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

@Injectable()
export class SettlementService implements OnModuleInit {
  private readonly logger = new Logger(SettlementService.name);

  constructor(
    @InjectRepository(Settlement)
    private settlementRepo: Repository<Settlement>,
    private ordersService: OrdersService,
    private redis: RedisService,
    private config: ConfigService,
  ) {}

  /**
   * Subscribe to batch:completed events from the Matching Engine
   */
  async onModuleInit(): Promise<void> {
    await this.redis.subscribe('adp:events:batch', async (message: string) => {
      try {
        const event = JSON.parse(message);
        if (event.type === 'batch:completed') {
          await this.processSettlement(event as BatchResult);
        }
      } catch (error) {
        this.logger.error('Failed to process batch event', (error as Error).message);
      }
    });
    this.logger.log('Settlement service subscribed to batch events');
  }

  /**
   * Process a batch settlement:
   * 1. Create settlement record
   * 2. Update matched orders to FILLED
   * 3. Submit on-chain transaction (V1: simulated, actual contract call when deployed)
   * 4. Publish settlement event for WebSocket broadcast
   */
  async processSettlement(batch: BatchResult): Promise<void> {
    this.logger.log(
      `Processing settlement for batch #${batch.batchId} [${batch.gpuType}]: ` +
        `${batch.matchedPairs.length} fills at $${batch.clearingPrice}/hr`,
    );

    let txHash: string | null = null;

    // Step 1: Submit on-chain (with retries)
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        txHash = await this.submitOnChain(batch);
        break;
      } catch (error) {
        this.logger.warn(
          `On-chain submission attempt ${attempt}/${MAX_RETRIES} failed: ${(error as Error).message}`,
        );
        if (attempt < MAX_RETRIES) {
          await this.delay(RETRY_DELAY_MS * Math.pow(2, attempt - 1));
        } else {
          this.logger.error(
            `Settlement for batch #${batch.batchId} failed after ${MAX_RETRIES} retries`,
          );
          // Still create the settlement record with null txHash
        }
      }
    }

    // Step 2: Create settlement record in database
    const settlement = this.settlementRepo.create({
      batchId: batch.batchId,
      clearingPrice: batch.clearingPrice.toFixed(6),
      totalVolume: batch.matchedVolume.toFixed(6),
      numFills: batch.matchedPairs.length,
      protocolFee: batch.protocolFee.toFixed(6),
      txHash,
      settledAt: new Date(),
    });

    try {
      await this.settlementRepo.save(settlement);
    } catch (error) {
      // Batch ID unique constraint — settlement already recorded (idempotent)
      if ((error as any)?.code === '23505') {
        this.logger.warn(`Settlement for batch #${batch.batchId} already exists, skipping`);
        return;
      }
      throw error;
    }

    // Step 3: Update all matched orders to FILLED
    const allOrderIds = batch.matchedPairs.flatMap((p) => [
      p.buyOrderId,
      p.sellOrderId,
    ]);

    await this.ordersService.fillOrders(
      allOrderIds,
      batch.batchId,
      batch.clearingPrice,
      txHash ?? `sim_${batch.batchId}`,
    );

    // Step 4: Publish settlement event for WebSocket broadcast
    await this.redis.publish(
      'adp:events:settlement',
      JSON.stringify({
        type: 'batch:settled',
        batchId: batch.batchId,
        gpuType: batch.gpuType,
        clearingPrice: batch.clearingPrice.toFixed(6),
        matchedVolume: batch.matchedVolume.toString(),
        numFills: batch.matchedPairs.length,
        protocolFee: batch.protocolFee.toFixed(6),
        txHash,
        timestamp: Date.now(),
      }),
    );

    // Step 5: Send Farcaster push notifications for settlement
    this.sendFarcasterNotification(
      `Batch #${batch.batchId} Settled`,
      `${batch.gpuType} — ${batch.matchedPairs.length} fills at $${batch.clearingPrice.toFixed(4)}/hr`,
      `https://darkpoolbase.org/miniapp/orders`,
    ).catch((err) =>
      this.logger.warn(`Farcaster notification failed: ${err.message}`),
    );

    this.logger.log(
      `Batch #${batch.batchId} settled: ${batch.matchedPairs.length} fills, ` +
        `$${batch.totalValueUSDC.toFixed(2)} volume, tx=${txHash ?? 'simulated'}`,
    );
  }

  /**
   * Submit settlement on-chain via DarkPool.settleBatch()
   *
   * V1: Simulated — generates a mock tx hash.
   * When contracts are deployed to Base Sepolia, this will:
   * 1. Sign the settlement hash with the relayer private key
   * 2. Call darkPool.settleBatch(settlement, signature) via viem
   * 3. Wait for transaction confirmation
   */
  private async submitOnChain(batch: BatchResult): Promise<string> {
    const darkPoolAddress = this.config.get<string>('DARKPOOL_ADDRESS');

    if (!darkPoolAddress || darkPoolAddress === '0x...') {
      // Contracts not deployed yet — simulate
      this.logger.debug(
        `Simulating on-chain settlement for batch #${batch.batchId} (no contract deployed)`,
      );
      return `0x${batch.batchId.toString(16).padStart(64, '0')}`;
    }

    // TODO: Real on-chain settlement when contracts are deployed
    // const relayerKey = this.config.get<string>('RELAYER_PRIVATE_KEY');
    // const rpcUrl = this.config.get<string>('RPC_URL');
    //
    // 1. Encode settlement data
    // 2. Sign with relayer key (ECDSA)
    // 3. Call darkPool.settleBatch(settlement, signature)
    // 4. Wait for tx receipt
    // 5. Return tx hash
    //
    // const walletClient = createWalletClient({ ... });
    // const txHash = await walletClient.writeContract({ ... });
    // return txHash;

    return `0x${batch.batchId.toString(16).padStart(64, '0')}`;
  }

  /**
   * Get recent settlements for API consumption
   */
  async getRecentSettlements(limit = 20): Promise<Settlement[]> {
    return this.settlementRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get settlement by batch ID
   */
  async getByBatchId(batchId: number): Promise<Settlement | null> {
    return this.settlementRepo.findOne({ where: { batchId } });
  }

  /**
   * Send push notification to all Farcaster users with notifications enabled
   */
  private async sendFarcasterNotification(
    title: string,
    body: string,
    targetUrl?: string,
  ): Promise<void> {
    const notifyUrl = this.config.get<string>('FC_NOTIFY_URL');
    if (!notifyUrl) return;

    const secret = this.config.get<string>('FC_NOTIFY_SECRET') || '';
    const res = await fetch(notifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-notify-secret': secret,
      },
      body: JSON.stringify({ title, body, targetUrl }),
    });

    if (!res.ok) {
      throw new Error(`Farcaster notify responded ${res.status}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

