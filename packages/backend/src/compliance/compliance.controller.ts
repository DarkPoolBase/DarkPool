import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post('proofs')
  @UseGuards(JwtAuthGuard)
  async submitProof(
    @Request() req: { user: { sub: string } },
    @Body()
    body: {
      proofType: string;
      jurisdiction: string;
      proofHash: string;
      publicInputsHash: string;
    },
  ) {
    return this.complianceService.submitProof(req.user.sub, body);
  }

  @Get('proofs')
  @UseGuards(JwtAuthGuard)
  async listProofs(
    @Request() req: { user: { sub: string } },
    @Query('proofType') proofType?: string,
    @Query('jurisdiction') jurisdiction?: string,
  ) {
    return this.complianceService.listUserProofs(
      req.user.sub,
      proofType,
      jurisdiction,
    );
  }

  @Get('proofs/:id')
  async getProof(@Param('id') id: string) {
    return this.complianceService.getProof(id);
  }

  @Post('proofs/:id/verify')
  @UseGuards(JwtAuthGuard)
  async verifyProof(@Param('id') id: string) {
    return this.complianceService.verifyProof(id);
  }

  @Post('proofs/:id/reject')
  @UseGuards(JwtAuthGuard)
  async rejectProof(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.complianceService.rejectProof(id, body.reason);
  }

  @Get('check/:userId')
  async checkCompliance(
    @Param('userId') userId: string,
    @Query('jurisdiction') jurisdiction: string,
  ) {
    return this.complianceService.checkCompliance(userId, jurisdiction);
  }

  @Get('jurisdictions')
  async listJurisdictions() {
    return this.complianceService.listJurisdictions();
  }

  @Post('jurisdictions')
  @UseGuards(JwtAuthGuard)
  async setJurisdictionConfig(
    @Body()
    body: {
      jurisdiction: string;
      amlRequired?: boolean;
      kycRequired?: boolean;
      taxReportingRequired?: boolean;
      maxTransactionValue?: string;
      proofExpiryDays?: number;
      regulations?: Record<string, unknown>;
      active?: boolean;
    },
  ) {
    const { jurisdiction, ...config } = body;
    return this.complianceService.setJurisdictionConfig(jurisdiction, config);
  }
}
