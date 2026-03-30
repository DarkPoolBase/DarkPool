import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AgentEconomyService } from './agent-economy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('agent-economy')
export class AgentEconomyController {
  constructor(private readonly economyService: AgentEconomyService) {}

  // ---------------------------------------------------------------------------
  // Rewards
  // ---------------------------------------------------------------------------

  @Post('rewards/distribute')
  @UseGuards(JwtAuthGuard)
  async distributeRewards(
    @Body()
    body: {
      epoch: number;
      rewards: { agentId: string; rewardType: string; amount: string }[];
    },
  ) {
    return this.economyService.distributeRewards(body.epoch, body.rewards);
  }

  @Post('rewards/:id/claim')
  @UseGuards(JwtAuthGuard)
  async claimReward(
    @Param('id') id: string,
    @Body() body: { agentId: string },
  ) {
    return this.economyService.claimReward(id, body.agentId);
  }

  @Get('rewards/:agentId')
  async getAgentRewards(
    @Param('agentId') agentId: string,
    @Query('rewardType') rewardType?: string,
  ) {
    return this.economyService.getAgentRewards(agentId, rewardType);
  }

  @Get('rewards/epoch/:epoch')
  async getEpochSummary(@Param('epoch') epoch: string) {
    return this.economyService.getEpochSummary(parseInt(epoch, 10));
  }

  @Get('yield/:agentId')
  async getTotalYield(@Param('agentId') agentId: string) {
    return this.economyService.getTotalYield(agentId);
  }

  // ---------------------------------------------------------------------------
  // Sessions
  // ---------------------------------------------------------------------------

  @Post('sessions')
  @UseGuards(JwtAuthGuard)
  async createSession(
    @Body()
    body: {
      agentId: string;
      sessionType: string;
      walletAddress: string;
      capabilities: string[];
      maxBudget?: string;
      expiresAt?: string;
    },
  ) {
    return this.economyService.createSession(
      body.agentId,
      body.sessionType,
      body.walletAddress,
      body.capabilities,
      body.maxBudget,
      body.expiresAt ? new Date(body.expiresAt) : undefined,
    );
  }

  @Get('sessions')
  async listSessions(@Query('agentId') agentId?: string) {
    return this.economyService.listSessions(agentId);
  }

  @Get('sessions/:id')
  async getSession(@Param('id') id: string) {
    return this.economyService.getSession(id);
  }

  @Post('sessions/:id/pause')
  @UseGuards(JwtAuthGuard)
  async pauseSession(@Param('id') id: string) {
    return this.economyService.pauseSession(id);
  }

  @Post('sessions/:id/revoke')
  @UseGuards(JwtAuthGuard)
  async revokeSession(@Param('id') id: string) {
    return this.economyService.revokeSession(id);
  }

  @Post('sessions/:id/spend')
  @UseGuards(JwtAuthGuard)
  async recordSessionSpend(
    @Param('id') id: string,
    @Body() body: { amount: string },
  ) {
    return this.economyService.recordSessionSpend(id, body.amount);
  }

  // ---------------------------------------------------------------------------
  // Partnerships
  // ---------------------------------------------------------------------------

  @Post('partnerships')
  @UseGuards(JwtAuthGuard)
  async submitPartnershipApplication(
    @Body() body: { agentId: string; proposal: string },
  ) {
    return this.economyService.submitPartnershipApplication(body.agentId, body.proposal);
  }

  @Get('partnerships/:agentId')
  async getPartnershipStatus(@Param('agentId') agentId: string) {
    return this.economyService.getPartnershipStatus(agentId);
  }
}
