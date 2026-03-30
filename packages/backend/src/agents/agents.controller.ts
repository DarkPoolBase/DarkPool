import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

/**
 * Agent-compatible endpoints for programmatic trading via AgentKit.
 * All endpoints require API key authentication (X-API-Key header).
 */
@Controller('agents')
@UseGuards(ApiKeyGuard)
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post('orders')
  async submitOrder(
    @Request() req: { user: { wallet: string } },
    @Body()
    body: {
      gpuType: string;
      quantity: number;
      maxPrice: string;
      duration: number;
    },
  ) {
    return this.agentsService.submitAgentOrder(req.user.wallet, body);
  }

  @Get('orders')
  async getOrders(@Request() req: { user: { wallet: string } }) {
    return this.agentsService.getAgentOrders(req.user.wallet);
  }

  @Delete('orders/:orderId')
  async cancelOrder(
    @Request() req: { user: { wallet: string } },
    @Param('orderId') orderId: string,
  ) {
    return this.agentsService.cancelAgentOrder(req.user.wallet, orderId);
  }

  @Get('balance')
  async getBalance(@Request() req: { user: { wallet: string } }) {
    return this.agentsService.getAgentBalance(req.user.wallet);
  }
}
