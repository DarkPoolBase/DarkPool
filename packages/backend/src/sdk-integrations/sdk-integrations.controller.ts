import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SdkIntegrationsService } from './sdk-integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sdk-integrations')
export class SdkIntegrationsController {
  constructor(private readonly sdkIntegrationsService: SdkIntegrationsService) {}

  // ── SDK Packages ─────────────────────────────────────────────────────

  @Post('packages')
  @UseGuards(JwtAuthGuard)
  async registerPackage(
    @Body()
    body: {
      name: string;
      version: string;
      description: string;
      docsUrl: string;
    },
  ) {
    return this.sdkIntegrationsService.registerSdkPackage(
      body.name,
      body.version,
      body.description,
      body.docsUrl,
    );
  }

  @Get('packages')
  async listPackages() {
    return this.sdkIntegrationsService.getSdkPackages();
  }

  // ── Grants ───────────────────────────────────────────────────────────

  @Post('grants')
  @UseGuards(JwtAuthGuard)
  async applyForGrant(
    @Body()
    body: {
      applicantAddress: string;
      projectName: string;
      projectDescription: string;
      grantAmount: string;
    },
  ) {
    return this.sdkIntegrationsService.applyForGrant(
      body.applicantAddress,
      body.projectName,
      body.projectDescription,
      body.grantAmount,
    );
  }

  @Get('grants')
  async listGrants(@Query('status') status?: string) {
    return this.sdkIntegrationsService.listGrants(status);
  }

  @Post('grants/:id/approve')
  @UseGuards(JwtAuthGuard)
  async approveGrant(@Param('id') id: string) {
    return this.sdkIntegrationsService.approveGrant(id);
  }

  @Post('grants/:id/reject')
  @UseGuards(JwtAuthGuard)
  async rejectGrant(@Param('id') id: string) {
    return this.sdkIntegrationsService.rejectGrant(id);
  }

  @Post('grants/:id/disburse')
  @UseGuards(JwtAuthGuard)
  async disburseGrant(@Param('id') id: string) {
    return this.sdkIntegrationsService.disburseGrant(id);
  }

  // ── Base Paymaster ───────────────────────────────────────────────────

  @Post('sponsor')
  @UseGuards(JwtAuthGuard)
  async sponsorTransaction(
    @Body() body: { userAddress: string; txData: string },
  ) {
    return this.sdkIntegrationsService.sponsorTransaction(
      body.userAddress,
      body.txData,
    );
  }

  @Get('sponsor/stats')
  async getSponsorshipStats() {
    return this.sdkIntegrationsService.getSponsorshipStats();
  }
}
