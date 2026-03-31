import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderExpiryService } from './services/order-expiry.service';
import { OrderMetricsService } from './services/order-metrics.service';
import { Order } from './entities/order.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), AuthModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderExpiryService, OrderMetricsService],
  exports: [OrdersService, OrderMetricsService],
})
export class OrdersModule {}

