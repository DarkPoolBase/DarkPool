import { Controller, Get, Query } from '@nestjs/common';
import { MarketService } from './market.service';

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('prices')
  async getPrices() {
    return this.marketService.getPrices();
  }

  @Get('prices/history')
  async getPriceHistory(
    @Query('gpuType') gpuType: string = 'H100',
    @Query('interval') interval: string = '1h',
    @Query('limit') limit?: string,
  ) {
    return this.marketService.getPriceHistory(
      gpuType,
      interval,
      limit ? parseInt(limit) : 100,
    );
  }

  @Get('volume')
  async getVolume() {
    return this.marketService.getVolume();
  }

  @Get('stats')
  async getStats() {
    return this.marketService.getStats();
  }
}
