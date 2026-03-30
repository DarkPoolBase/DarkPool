import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentEconomyController } from './agent-economy.controller';
import { AgentEconomyService } from './agent-economy.service';
import { AgentReward } from './entities/agent-reward.entity';
import { AgentKitSession } from './entities/agent-kit-session.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([AgentReward, AgentKitSession]), AuthModule],
  controllers: [AgentEconomyController],
  providers: [AgentEconomyService],
  exports: [AgentEconomyService],
})
export class AgentEconomyModule {}
