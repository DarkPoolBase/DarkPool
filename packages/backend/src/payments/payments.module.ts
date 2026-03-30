import { Module } from '@nestjs/common';
import { X402Service } from './x402.service';
import { PaymentsController } from './payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [X402Service],
  exports: [X402Service],
})
export class PaymentsModule {}
