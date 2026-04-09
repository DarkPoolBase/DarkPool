import { Module } from '@nestjs/common';
import { X402Service } from './x402.service';
import { X402Guard } from './x402.guard';
import { PaymentsController } from './payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [X402Service, X402Guard],
  exports: [X402Service, X402Guard],
})
export class PaymentsModule {}
