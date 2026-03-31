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

@Controller('agents')
@UseGuards(ApiKeyGuard)
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post('orders')
  async submitOrder(
    @Request() req: { user: { sub: string; wallet: string } },
    @Body() body: { gpuType: string; quantity: number; maxPrice: string; duration: number },
  ) {
    return this.agentsService.submitAgentOrder(req.user.sub, req.user.wallet, body);
  }

  @Get('orders')
  async getOrders(@Request() req: { user: { sub: string } }) {
    return this.agentsService.getAgentOrders(req.user.sub);
  }

  @Delete('orders/:orderId')
  async cancelOrder(
    @Request() req: { user: { sub: string } },
    @Param('orderId') orderId: string,
  ) {
    return this.agentsService.cancelAgentOrder(req.user.sub, orderId);
  }

  @Get('balance')
  async getBalance(@Request() req: { user: { wallet: string } }) {
    return this.agentsService.getAgentBalance(req.user.wallet);
  }
}

