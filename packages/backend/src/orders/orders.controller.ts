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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * POST /api/orders
   * Submit a new encrypted order
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Request() req: { user: { sub: string; wallet: string } },
    @Body() body: CreateOrderInput,
  ) {
    return this.ordersService.create(req.user.sub, req.user.wallet, body);
  }

  /**
   * GET /api/orders
   * List current user's orders with optional filters
   */
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

  /**
   * GET /api/orders/stats
   * Get order count by status for the current user
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@Request() req: { user: { sub: string } }) {
    return this.ordersService.countByStatus(req.user.sub);
  }

  /**
   * GET /api/orders/:id
   * Get a single order by ID (must belong to current user)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ) {
    return this.ordersService.findById(id, req.user.sub);
  }

  /**
   * DELETE /api/orders/:id
   * Cancel an active order
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async cancel(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ) {
    return this.ordersService.cancel(id, req.user.sub);
  }
}
