import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderExpiryService } from './services/order-expiry.service';
import { OrderMetricsService } from './services/order-metrics.service';
import { Order } from './entities/order.entity';
import { AuthModule } from '../auth/auth.module';
import { OrderCommandHandlers } from './commands';
import { OrderQueryHandlers } from './queries';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), CqrsModule, AuthModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrderExpiryService,
    OrderMetricsService,
    ...OrderCommandHandlers,
    ...OrderQueryHandlers,
  ],
  exports: [OrdersService, OrderMetricsService],
})
export class OrdersModule {}
