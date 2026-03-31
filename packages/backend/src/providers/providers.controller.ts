import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async register(
    @Request() req: { user: { sub: string } },
    @Body()
    body: {
      name: string;
      gpuTypes: { type: string; count: number; available: number }[];
      region?: string;
    },
  ) {
    return this.providersService.register(req.user.sub, body);
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.providersService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.providersService.findById(id);
  }

  @Patch(':id/capacity')
  @UseGuards(JwtAuthGuard)
  async updateCapacity(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
    @Body()
    body: { gpuTypes: { type: string; count: number; available: number }[] },
  ) {
    return this.providersService.updateCapacity(id, req.user.sub, body.gpuTypes);
  }

  @Get(':id/reputation')
  async getReputation(@Param('id') id: string) {
    return this.providersService.getReputation(id);
  }
}

