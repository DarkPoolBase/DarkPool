import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataListingsController } from './data-listings.controller';
import { DataListingsService } from './data-listings.service';
import { DataListing } from './entities/data-listing.entity';
import { DataAccessLog } from './entities/data-access-log.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([DataListing, DataAccessLog]), AuthModule],
  controllers: [DataListingsController],
  providers: [DataListingsService],
  exports: [DataListingsService],
})
export class DataMarketplaceModule {}
