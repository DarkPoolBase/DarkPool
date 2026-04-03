import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { MarketService, GpuPrice } from '../market/market.service';

@Injectable()
export class FarcasterBotService implements OnModuleInit {
  private readonly logger = new Logger(FarcasterBotService.name);
  private client: NeynarAPIClient | null = null;
  private signerUuid: string | null = null;
  private enabled = false;
  private lastPrices: Map<string, number> = new Map();

  constructor(
    private config: ConfigService,
    private market: MarketService,
  ) {}

  onModuleInit() {
    const apiKey = this.config.get<string>('NEYNAR_API_KEY');
    const signer = this.config.get<string>('NEYNAR_SIGNER_UUID');

    if (!apiKey || !signer) {
      this.logger.warn(
        'Farcaster bot disabled — set NEYNAR_API_KEY and NEYNAR_SIGNER_UUID to enable',
      );
      return;
    }

    this.client = new NeynarAPIClient({ apiKey });
    this.signerUuid = signer;
    this.enabled = true;
    this.logger.log('Farcaster bot initialized');
  }

  /** Cast GPU price updates every 4 hours */
  @Cron(CronExpression.EVERY_4_HOURS)
  async castPriceUpdate() {
    if (!this.enabled || !this.client || !this.signerUuid) return;

    try {
      const prices = await this.market.getPrices();
      const text = this.formatPriceUpdate(prices);

      const result = await this.client.publishCast({
        signerUuid: this.signerUuid,
        text,
        embeds: [{ url: 'https://darkpoolbase.org/miniapp' }],
      });

      this.logger.log(`Cast published: ${result.cast.hash}`);

      // Store prices for next comparison
      for (const p of prices) {
        this.lastPrices.set(p.gpuType, parseFloat(p.price));
      }
    } catch (err) {
      this.logger.error('Failed to cast price update', err);
    }
  }

  /** Cast when significant price movement detected (>10% change) */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkPriceAlerts() {
    if (!this.enabled || !this.client || !this.signerUuid) return;
    if (this.lastPrices.size === 0) return;

    try {
      const prices = await this.market.getPrices();

      for (const p of prices) {
        const prev = this.lastPrices.get(p.gpuType);
        if (!prev) continue;

        const current = parseFloat(p.price);
        const changePct = ((current - prev) / prev) * 100;

        if (Math.abs(changePct) >= 10) {
          const direction = changePct > 0 ? 'up' : 'down';
          const emoji = changePct > 0 ? '\u2191' : '\u2193';

          const text = [
            `${emoji} ${p.gpuType} price alert`,
            ``,
            `$${prev.toFixed(2)} -> $${current.toFixed(2)}/hr (${changePct > 0 ? '+' : ''}${changePct.toFixed(1)}%)`,
            ``,
            `${p.gpuType} spot price moved ${direction} significantly in the last 30 minutes.`,
          ].join('\n');

          await this.client.publishCast({
            signerUuid: this.signerUuid,
            text,
            embeds: [{ url: 'https://darkpoolbase.org/miniapp' }],
          });

          this.logger.log(`Price alert cast for ${p.gpuType}: ${changePct.toFixed(1)}%`);
          this.lastPrices.set(p.gpuType, current);
        }
      }
    } catch (err) {
      this.logger.error('Failed to check price alerts', err);
    }
  }

  private formatPriceUpdate(prices: GpuPrice[]): string {
    const header = 'DarkPool GPU Market Update';
    const divider = '\u2500'.repeat(24);

    const lines = prices.map((p) => {
      const price = parseFloat(p.price).toFixed(2);
      const change = p.change24h;
      const arrow = change > 0 ? '\u2191' : change < 0 ? '\u2193' : '\u2192';
      const sign = change > 0 ? '+' : '';
      return `${p.gpuType.padEnd(5)} $${price}/hr ${arrow}${sign}${change.toFixed(1)}%`;
    });

    const totalVol = prices.reduce((s, p) => s + parseFloat(p.volume24h), 0);

    return [
      header,
      divider,
      ...lines,
      divider,
      `24h volume: ${totalVol.toLocaleString()} GPU-hrs`,
    ].join('\n');
  }

  /** Manual trigger for testing */
  async castNow(): Promise<string | null> {
    if (!this.enabled) return null;
    await this.castPriceUpdate();
    return 'cast sent';
  }
}
