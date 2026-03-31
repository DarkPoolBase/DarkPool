import { Controller, Get, Param, Query } from '@nestjs/common';
import { SettlementService } from './settlement.service';

@Controller('settlements')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  /**
   * GET /api/settlements
   * List recent settlements (public)
   */
  @Get()
  async getRecent(@Query('limit') limit?: string) {
    return this.settlementService.getRecentSettlements(
      limit ? parseInt(limit) : 20,
    );
  }

  /**
   * GET /api/settlements/:batchId
   * Get settlement by batch ID (public)
   */
  @Get(':batchId')
  async getByBatchId(@Param('batchId') batchId: string) {
    const settlement = await this.settlementService.getByBatchId(
      parseInt(batchId),
    );
    if (!settlement) {
      return { message: `Settlement for batch #${batchId} not found` };
    }
    return settlement;
  }
}

