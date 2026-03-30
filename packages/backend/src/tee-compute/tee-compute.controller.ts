import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TeeComputeService } from './tee-compute.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tee-compute')
export class TeeComputeController {
  constructor(private readonly teeService: TeeComputeService) {}

  @Post('jobs')
  @UseGuards(JwtAuthGuard)
  async submitJob(
    @Request() req: { user: { sub: string } },
    @Body()
    body: {
      container: string;
      encryptedInput: string;
      gpuType: string;
      maxDuration?: number;
    },
  ) {
    return this.teeService.submitJob(req.user.sub, body);
  }

  @Get('jobs')
  @UseGuards(JwtAuthGuard)
  async listJobs(
    @Request() req: { user: { sub: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.teeService.listJobs(
      req.user.sub,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('jobs/:id')
  async getJobStatus(@Param('id') id: string) {
    return this.teeService.getJobStatus(id);
  }

  @Get('jobs/:id/result')
  async getJobResult(@Param('id') id: string) {
    return this.teeService.getJobResult(id);
  }

  @Delete('jobs/:id')
  @UseGuards(JwtAuthGuard)
  async cancelJob(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ) {
    return this.teeService.cancelJob(id, req.user.sub);
  }

  @Post('nodes')
  @UseGuards(JwtAuthGuard)
  async registerNode(
    @Body()
    body: {
      nodeAddress: string;
      enclaveId: string;
      gpuTypes: Array<{ type: string; count: number; available: number }>;
      region?: string;
    },
  ) {
    return this.teeService.registerNode(
      body.nodeAddress,
      body.enclaveId,
      body.gpuTypes,
      body.region,
    );
  }

  @Get('nodes')
  async listNodes() {
    return this.teeService.listNodes();
  }

  @Post('nodes/:id/heartbeat')
  @UseGuards(JwtAuthGuard)
  async heartbeat(@Param('id') id: string) {
    await this.teeService.updateNodeHeartbeat(id);
    return { success: true };
  }
}
