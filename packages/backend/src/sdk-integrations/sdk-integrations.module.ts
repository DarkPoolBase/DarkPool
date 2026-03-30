import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SdkIntegrationsController } from './sdk-integrations.controller';
import { SdkIntegrationsService } from './sdk-integrations.service';
import { SdkGrant } from './entities/sdk-grant.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([SdkGrant]), AuthModule],
  controllers: [SdkIntegrationsController],
  providers: [SdkIntegrationsService],
  exports: [SdkIntegrationsService],
})
export class SdkIntegrationsModule {}
