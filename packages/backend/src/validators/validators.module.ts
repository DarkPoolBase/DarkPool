import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValidatorsController } from './validators.controller';
import { ValidatorsService } from './validators.service';
import { Validator } from './entities/validator.entity';
import { ValidationJob } from './entities/validation-job.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Validator, ValidationJob]), AuthModule],
  controllers: [ValidatorsController],
  providers: [ValidatorsService],
  exports: [ValidatorsService],
})
export class ValidatorsModule {}
