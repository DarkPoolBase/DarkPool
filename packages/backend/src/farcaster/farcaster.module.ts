import { Module } from '@nestjs/common';
import { FarcasterBotService } from './farcaster-bot.service';
import { MarketModule } from '../market/market.module';

@Module({
  imports: [MarketModule],
  providers: [FarcasterBotService],
  exports: [FarcasterBotService],
})
export class FarcasterModule {}
