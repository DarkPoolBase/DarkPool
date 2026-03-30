import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndexerService } from './indexer.service';
import { IndexedEvent } from './entities/indexed-event.entity';
import { Settlement } from './entities/settlement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IndexedEvent, Settlement])],
  providers: [IndexerService],
  exports: [IndexerService],
})
export class IndexerModule {}
