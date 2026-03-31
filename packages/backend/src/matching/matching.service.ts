import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { OrdersService } from '../orders/orders.service';
import { RedisService } from '../redis/redis.service';

const GPU_TYPES = ['H100', 'A100', 'RTX4090', 'L40S', 'H200', 'A10G'];
const BATCH_INTERVAL_MS = 45_000; // 45 seconds
const LOCK_KEY = 'adp:matching:lock';
const LOCK_TTL = 30; // seconds
const BATCH_COUNTER_KEY = 'adp:matching:batchId';
const PROTOCOL_FEE_BPS = 80; // 0.8%

export interface MatchedPair {
  buyOrderId: string;
  sellOrderId: string;
  buyerWallet: string;
  sellerWallet: string;
  quantity: number;
  duration: number;
}

export interface BatchResult {
  batchId: number;
  gpuType: string;
  clearingPrice: number;
  matchedPairs: MatchedPair[];
  matchedVolume: number;
  totalValueUSDC: number;
  protocolFee: number;
  unmatchedBuyOrders: string[];
  unmatchedSellOrders: string[];
  timestamp: number;
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);
  private isRunning = false;

  constructor(
    private ordersService: OrdersService,
    private redis: RedisService,
  ) {}

  /**
   * Main batch auction loop — runs every 45 seconds
   */
  @Interval(BATCH_INTERVAL_MS)
  async runBatchCycle(): Promise<void> {
    if (this.isRunning) {
      this.logger.debug('Previous batch still running, skipping');
      return;
    }

    // Distributed lock via Redis to prevent concurrent runs
    const lockAcquired = await this.acquireLock();
    if (!lockAcquired) {
      this.logger.debug('Could not acquire lock, another instance is running');
      return;
    }

    this.isRunning = true;
    try {
      // Announce batch phase
      await this.redis.publish(
        'adp:events:batch',
        JSON.stringify({ type: 'batch:phase', phase: 'MATCHING', timestamp: Date.now() }),
      );

      const results: BatchResult[] = [];

      for (const gpuType of GPU_TYPES) {
        const result = await this.runAuctionForGpuType(gpuType);
        if (result) {
          results.push(result);
        }
      }

      if (results.length > 0) {
        this.logger.log(
          `Batch complete: ${results.length} GPU types matched, ` +
            `${results.reduce((s, r) => s + r.matchedPairs.length, 0)} total fills`,
        );
      }

      // Announce collection phase for next batch
      await this.redis.publish(
        'adp:events:batch',
        JSON.stringify({ type: 'batch:phase', phase: 'COLLECTING', timestamp: Date.now() }),
      );
    } catch (error) {
      this.logger.error('Batch cycle failed', (error as Error).stack);
    } finally {
      this.isRunning = false;
      await this.releaseLock();
    }
  }

  /**
   * Run a batch auction for a single GPU type
   * Uses uniform price clearing: find the price that maximizes matched volume
   */
  async runAuctionForGpuType(gpuType: string): Promise<BatchResult | null> {
    const orders = await this.ordersService.getActiveOrdersByGpuType(gpuType);
    if (orders.length < 2) return null;

    // Separate buy and sell orders
    const buyOrders = orders
      .filter((o) => o.side === 'BUY')
      .map((o) => ({
        id: o.id,
        wallet: o.walletAddress,
        price: parseFloat(o.pricePerHour),
        quantity: o.quantity,
        duration: o.duration,
        gpuHours: o.quantity * o.duration,
      }))
      .sort((a, b) => b.price - a.price); // Highest bid first

    const sellOrders = orders
      .filter((o) => o.side === 'SELL')
      .map((o) => ({
        id: o.id,
        wallet: o.walletAddress,
        price: parseFloat(o.pricePerHour),
        quantity: o.quantity,
        duration: o.duration,
        gpuHours: o.quantity * o.duration,
      }))
      .sort((a, b) => a.price - b.price); // Lowest ask first

    if (buyOrders.length === 0 || sellOrders.length === 0) return null;

    // Check if any trade is possible: best bid must >= best ask
    if (buyOrders[0].price < sellOrders[0].price) return null;

    // Find clearing price using supply-demand intersection
    const clearingPrice = this.findClearingPrice(buyOrders, sellOrders);
    if (clearingPrice === null) return null;

    // Match orders at the clearing price
    const matchedBuys = buyOrders.filter((o) => o.price >= clearingPrice);
    const matchedSells = sellOrders.filter((o) => o.price <= clearingPrice);

    // Pair them up (1:1 for V1 — all-or-nothing fills)
    const pairCount = Math.min(matchedBuys.length, matchedSells.length);
    const matchedPairs: MatchedPair[] = [];

    for (let i = 0; i < pairCount; i++) {
      matchedPairs.push({
        buyOrderId: matchedBuys[i].id,
        sellOrderId: matchedSells[i].id,
        buyerWallet: matchedBuys[i].wallet,
        sellerWallet: matchedSells[i].wallet,
        quantity: Math.min(matchedBuys[i].quantity, matchedSells[i].quantity),
        duration: Math.min(matchedBuys[i].duration, matchedSells[i].duration),
      });
    }

    if (matchedPairs.length === 0) return null;

    // Calculate totals
    const matchedVolume = matchedPairs.reduce(
      (sum, p) => sum + p.quantity * p.duration,
      0,
    );
    const totalValueUSDC = matchedVolume * clearingPrice;
    const protocolFee = (totalValueUSDC * PROTOCOL_FEE_BPS) / 10000;

    // Get next batch ID
    const batchId = await this.getNextBatchId();

    const result: BatchResult = {
      batchId,
      gpuType,
      clearingPrice,
      matchedPairs,
      matchedVolume,
      totalValueUSDC,
      protocolFee,
      unmatchedBuyOrders: matchedBuys.slice(pairCount).map((o) => o.id),
      unmatchedSellOrders: matchedSells.slice(pairCount).map((o) => o.id),
      timestamp: Date.now(),
    };

    this.logger.log(
      `[${gpuType}] Batch #${batchId}: clearing=$${clearingPrice}/hr, ` +
        `fills=${matchedPairs.length}, volume=${matchedVolume} GPU-hrs, ` +
        `value=$${totalValueUSDC.toFixed(2)}`,
    );

    // Publish result for Settlement Service to pick up
    await this.redis.publish(
      'adp:events:batch',
      JSON.stringify({ type: 'batch:completed', ...result }),
    );

    return result;
  }

  /**
   * Find the uniform clearing price that maximizes matched volume
   * Uses supply-demand curve intersection
   */
  private findClearingPrice(
    buyOrders: { price: number; gpuHours: number }[],
    sellOrders: { price: number; gpuHours: number }[],
  ): number | null {
    // Collect all candidate prices
    const candidatePrices = new Set<number>();
    for (const o of buyOrders) candidatePrices.add(o.price);
    for (const o of sellOrders) candidatePrices.add(o.price);

    const prices = Array.from(candidatePrices).sort((a, b) => a - b);

    let bestPrice: number | null = null;
    let bestVolume = 0;

    for (const price of prices) {
      // Cumulative demand at this price (buyers willing to pay >= price)
      const demand = buyOrders
        .filter((o) => o.price >= price)
        .reduce((sum, o) => sum + o.gpuHours, 0);

      // Cumulative supply at this price (sellers willing to accept <= price)
      const supply = sellOrders
        .filter((o) => o.price <= price)
        .reduce((sum, o) => sum + o.gpuHours, 0);

      // Matched volume is the minimum of supply and demand
      const matched = Math.min(demand, supply);

      if (matched > bestVolume) {
        bestVolume = matched;
        bestPrice = price;
      }
    }

    return bestPrice;
  }

  /**
   * Distributed lock using Redis SET NX EX
   */
  private async acquireLock(): Promise<boolean> {
    const client = this.redis.getClient();
    const result = await client.set(LOCK_KEY, '1', 'EX', LOCK_TTL, 'NX');
    return result === 'OK';
  }

  private async releaseLock(): Promise<void> {
    await this.redis.del(LOCK_KEY);
  }

  /**
   * Auto-incrementing batch counter stored in Redis
   */
  private async getNextBatchId(): Promise<number> {
    const client = this.redis.getClient();
    return client.incr(BATCH_COUNTER_KEY);
  }

  /**
   * Manual trigger for testing (bypasses the interval)
   */
  async triggerManualBatch(): Promise<BatchResult[]> {
    const results: BatchResult[] = [];
    for (const gpuType of GPU_TYPES) {
      const result = await this.runAuctionForGpuType(gpuType);
      if (result) results.push(result);
    }
    return results;
  }
}
