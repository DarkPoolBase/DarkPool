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
import { DataListingsService } from './data-listings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('data')
export class DataListingsController {
  constructor(private readonly dataService: DataListingsService) {}

  @Post('listings')
  @UseGuards(JwtAuthGuard)
  async createListing(
    @Request() req: { user: { sub: string; wallet: string } },
    @Body()
    body: {
      category: string;
      format: string;
      sizeGb: number;
      metadataHash: string;
      qualityScore: number;
      pricePerAccess: string;
      privacyProof?: string;
      description?: string;
      tags?: string[];
    },
  ) {
    return this.dataService.create(req.user.sub, req.user.wallet, body);
  }

  @Get('listings')
  async searchListings(
    @Query('category') category?: string,
    @Query('format') format?: string,
    @Query('minSize') minSize?: string,
    @Query('maxSize') maxSize?: string,
    @Query('minQuality') minQuality?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dataService.search({
      category,
      format,
      minSize: minSize ? parseFloat(minSize) : undefined,
      maxSize: maxSize ? parseFloat(maxSize) : undefined,
      minQuality: minQuality ? parseInt(minQuality) : undefined,
      maxPrice,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('listings/:id')
  async getListing(@Param('id') id: string) {
    return this.dataService.findById(id);
  }

  @Post('listings/:id/access')
  @UseGuards(JwtAuthGuard)
  async recordAccess(
    @Param('id') id: string,
    @Request() req: { user: { wallet: string } },
    @Body() body: { paymentAmount: string; txHash?: string },
  ) {
    return this.dataService.recordAccess(
      id,
      req.user.wallet,
      body.paymentAmount,
      body.txHash,
    );
  }

  @Get('listings/:id/access-history')
  async getAccessHistory(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dataService.getAccessHistory(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Delete('listings/:id')
  @UseGuards(JwtAuthGuard)
  async deactivateListing(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ) {
    await this.dataService.deactivate(id, req.user.sub);
    return { success: true };
  }

  @Get('my-listings')
  @UseGuards(JwtAuthGuard)
  async getMyListings(@Request() req: { user: { sub: string } }) {
    return this.dataService.getProviderListings(req.user.sub);
  }
}
