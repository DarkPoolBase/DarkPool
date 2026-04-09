import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetRecentSettlementsQuery } from './queries/get-recent-settlements.query';
import { GetSettlementQuery } from './queries/get-settlement.query';

@Controller('settlements')
export class SettlementController {
  constructor(private readonly queryBus: QueryBus) {}

  /**
   * GET /api/settlements
   * List recent settlements (public)
   */
  @Get()
  async getRecent(@Query('limit') limit?: string) {
    return this.queryBus.execute(
      new GetRecentSettlementsQuery(limit ? parseInt(limit) : 20),
    );
  }

  /**
   * GET /api/settlements/:batchId
   * Get settlement by batch ID (public)
   */
  @Get(':batchId')
  async getByBatchId(@Param('batchId') batchId: string) {
    const settlement = await this.queryBus.execute(
      new GetSettlementQuery(parseInt(batchId)),
    );
    if (!settlement) {
      return { message: `Settlement for batch #${batchId} not found` };
    }
    return settlement;
  }
}
