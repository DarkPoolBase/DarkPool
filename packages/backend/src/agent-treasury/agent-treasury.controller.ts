import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AgentTreasuryService } from './agent-treasury.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('agent-treasury')
export class AgentTreasuryController {
  constructor(private readonly treasuryService: AgentTreasuryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createTreasury(
    @Body()
    body: {
      agentId: string;
      ownerAddress: string;
      treasuryAddress: string;
      dailySpendLimit?: string;
      monthlySpendLimit?: string;
      approvalThreshold?: string;
      yieldStrategy?: string;
    },
  ) {
    return this.treasuryService.createTreasury(
      body.agentId,
      body.ownerAddress,
      body.treasuryAddress,
      {
        dailySpendLimit: body.dailySpendLimit,
        monthlySpendLimit: body.monthlySpendLimit,
        approvalThreshold: body.approvalThreshold,
        yieldStrategy: body.yieldStrategy,
      },
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async listTreasuries(@Query('ownerAddress') ownerAddress?: string) {
    return this.treasuryService.listTreasuries(ownerAddress);
  }

  @Get(':agentId')
  async getTreasury(@Param('agentId') agentId: string) {
    return this.treasuryService.getTreasury(agentId);
  }

  @Post(':agentId/deposit')
  @UseGuards(JwtAuthGuard)
  async deposit(
    @Param('agentId') agentId: string,
    @Body() body: { amount: string },
  ) {
    return this.treasuryService.deposit(agentId, body.amount);
  }

  @Post(':agentId/withdraw')
  @UseGuards(JwtAuthGuard)
  async withdraw(
    @Param('agentId') agentId: string,
    @Body() body: { amount: string; ownerAddress: string },
  ) {
    return this.treasuryService.withdraw(agentId, body.amount, body.ownerAddress);
  }

  @Post(':agentId/spend')
  @UseGuards(JwtAuthGuard)
  async spend(
    @Param('agentId') agentId: string,
    @Body() body: { amount: string; recipient: string; description?: string },
  ) {
    return this.treasuryService.spend(agentId, body.amount, body.recipient, body.description);
  }

  @Post(':agentId/micropayment')
  @UseGuards(JwtAuthGuard)
  async micropayment(
    @Param('agentId') agentId: string,
    @Body() body: { amount: string; recipient: string; description?: string },
  ) {
    return this.treasuryService.micropayment(agentId, body.amount, body.recipient, body.description);
  }

  @Get(':agentId/transactions')
  async listTransactions(
    @Param('agentId') agentId: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.treasuryService.listTransactions(agentId, {
      type,
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('transactions/:id/approve')
  @UseGuards(JwtAuthGuard)
  async approveTransaction(
    @Param('id') id: string,
    @Body() body: { approverAddress: string },
  ) {
    return this.treasuryService.approveTransaction(id, body.approverAddress);
  }

  @Post('transactions/:id/reject')
  @UseGuards(JwtAuthGuard)
  async rejectTransaction(
    @Param('id') id: string,
    @Body() body: { approverAddress: string },
  ) {
    return this.treasuryService.rejectTransaction(id, body.approverAddress);
  }

  @Post(':agentId/yield/allocate')
  @UseGuards(JwtAuthGuard)
  async allocateToYield(
    @Param('agentId') agentId: string,
    @Body() body: { amount: string },
  ) {
    return this.treasuryService.allocateToYield(agentId, body.amount);
  }

  @Post(':agentId/yield/withdraw')
  @UseGuards(JwtAuthGuard)
  async withdrawFromYield(
    @Param('agentId') agentId: string,
    @Body() body: { amount: string },
  ) {
    return this.treasuryService.withdrawFromYield(agentId, body.amount);
  }

  @Get(':agentId/yield/stats')
  async getYieldStats(@Param('agentId') agentId: string) {
    return this.treasuryService.getYieldStats(agentId);
  }

  @Patch(':agentId/limits')
  @UseGuards(JwtAuthGuard)
  async updateLimits(
    @Param('agentId') agentId: string,
    @Body()
    body: {
      dailySpendLimit?: string;
      monthlySpendLimit?: string;
      approvalThreshold?: string;
    },
  ) {
    return this.treasuryService.updateLimits(agentId, body);
  }

  @Patch(':agentId/strategy')
  @UseGuards(JwtAuthGuard)
  async setYieldStrategy(
    @Param('agentId') agentId: string,
    @Body() body: { strategy: string },
  ) {
    return this.treasuryService.setYieldStrategy(agentId, body.strategy);
  }
}
