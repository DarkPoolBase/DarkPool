import { Controller, Post, UseGuards } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  /**
   * POST /api/matching/trigger
   * Manually trigger a batch auction (admin only, for testing)
   */
  @Post('trigger')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async triggerBatch() {
    const results = await this.matchingService.triggerManualBatch();
    return {
      message: `Batch triggered: ${results.length} GPU types processed`,
      results,
    };
  }
}
