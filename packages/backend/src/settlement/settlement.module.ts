import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { SettlementService } from './settlement.service';
import { SettlementController } from './settlement.controller';
import { Settlement } from '../indexer/entities/settlement.entity';
import { OrdersModule } from '../orders/orders.module';
import { SettlementQueryHandlers } from './queries';

@Module({
  imports: [
    TypeOrmModule.forFeature([Settlement]),
    CqrsModule,
    OrdersModule,
  ],
  controllers: [SettlementController],
  providers: [SettlementService, ...SettlementQueryHandlers],
  exports: [SettlementService],
})
export class SettlementModule {}
