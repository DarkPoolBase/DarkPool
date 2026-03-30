import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeeComputeController } from './tee-compute.controller';
import { TeeComputeService } from './tee-compute.service';
import { TeeJob } from './entities/tee-job.entity';
import { TeeNode } from './entities/tee-node.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([TeeJob, TeeNode]), AuthModule],
  controllers: [TeeComputeController],
  providers: [TeeComputeService],
  exports: [TeeComputeService],
})
export class TeeComputeModule {}
