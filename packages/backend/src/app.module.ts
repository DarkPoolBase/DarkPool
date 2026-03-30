import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { databaseConfig } from './config/database.config';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { ProvidersModule } from './providers/providers.module';
import { MarketModule } from './market/market.module';
import { WebsocketModule } from './websocket/websocket.module';
import { IndexerModule } from './indexer/indexer.module';
import { RedisModule } from './redis/redis.module';
import { PaymentsModule } from './payments/payments.module';
import { AgentsModule } from './agents/agents.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development'],
    }),
    TypeOrmModule.forRootAsync(databaseConfig),
    ScheduleModule.forRoot(),
    RedisModule,
    HealthModule,
    AuthModule,
    ProvidersModule,
    MarketModule,
    WebsocketModule,
    IndexerModule,
    PaymentsModule,
    AgentsModule,
  ],
})
export class AppModule {}
