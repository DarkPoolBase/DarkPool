import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService, CreateOrderInput } from './orders.service';
import { OrderMetricsService } from './services/order-metrics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseOrderIdPipe } from './pipes/parse-order-id.pipe';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly metricsService: OrderMetricsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Request() req: { user: { sub: string; wallet: string } },
    @Body() body: CreateOrderInput,
  ) {
    return this.ordersService.create(req.user.sub, req.user.wallet, body);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Request() req: { user: { sub: string } },
    @Query('status') status?: string,
    @Query('side') side?: string,
    @Query('gpuType') gpuType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findAllForUser(req.user.sub, {
      status,
      side,
      gpuType,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@Request() req: { user: { sub: string } }) {
    return this.ordersService.countByStatus(req.user.sub);
  }

  @Get('metrics')
  async getMetrics() {
    return this.metricsService.getMetrics();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(
    @Param('id', ParseOrderIdPipe) id: string,
    @Request() req: { user: { sub: string } },
  ) {
    return this.ordersService.findById(id, req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async cancel(
    @Param('id', ParseOrderIdPipe) id: string,
    @Request() req: { user: { sub: string } },
  ) {
    return this.ordersService.cancel(id, req.user.sub);
  }
}

