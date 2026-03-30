import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentTreasuryController } from './agent-treasury.controller';
import { AgentTreasuryService } from './agent-treasury.service';
import { AgentTreasury } from './entities/agent-treasury.entity';
import { TreasuryTransaction } from './entities/treasury-transaction.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([AgentTreasury, TreasuryTransaction]), AuthModule],
  controllers: [AgentTreasuryController],
  providers: [AgentTreasuryService],
  exports: [AgentTreasuryService],
})
export class AgentTreasuryModule {}
