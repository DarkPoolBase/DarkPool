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
import { DataMarketplaceModule } from './data-marketplace/data-marketplace.module';
import { ValidatorsModule } from './validators/validators.module';
import { TeeComputeModule } from './tee-compute/tee-compute.module';
import { ComplianceModule } from './compliance/compliance.module';
import { SdkIntegrationsModule } from './sdk-integrations/sdk-integrations.module';
import { AgentTreasuryModule } from './agent-treasury/agent-treasury.module';
import { AgentEconomyModule } from './agent-economy/agent-economy.module';
import { OrdersModule } from './orders/orders.module';
import { MatchingModule } from './matching/matching.module';
import { SettlementModule } from './settlement/settlement.module';

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
    DataMarketplaceModule,
    ValidatorsModule,
    TeeComputeModule,
    ComplianceModule,
    SdkIntegrationsModule,
    AgentTreasuryModule,
    AgentEconomyModule,
    OrdersModule,
    MatchingModule,
    SettlementModule,
  ],
})
export class AppModule {}
