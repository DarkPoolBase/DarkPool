import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ValidatorsService } from './validators.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('validators')
export class ValidatorsController {
  constructor(private readonly validatorsService: ValidatorsService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  async register(
    @Request() req: { user: { wallet: string } },
    @Body() body: { stakeAmount: string },
  ) {
    return this.validatorsService.register(req.user.wallet, body.stakeAmount);
  }

  @Get()
  async listValidators() {
    return this.validatorsService.listValidators();
  }

  @Get(':wallet')
  async getValidator(@Param('wallet') wallet: string) {
    return this.validatorsService.getValidator(wallet);
  }

  @Post('jobs')
  @UseGuards(JwtAuthGuard)
  async createJob(
    @Body()
    body: {
      jobId: string;
      modelId: number;
      proofHash: string;
      feeAmount: string;
    },
  ) {
    return this.validatorsService.createValidationJob(
      body.jobId,
      body.modelId,
      body.proofHash,
      body.feeAmount,
    );
  }

  @Post('jobs/:id/vote')
  @UseGuards(JwtAuthGuard)
  async submitVote(
    @Param('id') jobId: string,
    @Request() req: { user: { wallet: string } },
    @Body() body: { isValid: boolean },
  ) {
    return this.validatorsService.submitVote(jobId, req.user.wallet, body.isValid);
  }

  @Get('jobs/:id')
  async getJobStatus(@Param('id') jobId: string) {
    return this.validatorsService.getJobStatus(jobId);
  }
}
