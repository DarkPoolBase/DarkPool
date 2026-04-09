import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settlement } from '../../indexer/entities/settlement.entity';

export class GetSettlementQuery implements IQuery {
  constructor(public readonly batchId: number) {}
}

@QueryHandler(GetSettlementQuery)
export class GetSettlementHandler implements IQueryHandler<GetSettlementQuery> {
  constructor(
    @InjectRepository(Settlement) private settlementRepo: Repository<Settlement>,
  ) {}

  async execute(query: GetSettlementQuery): Promise<Settlement | null> {
    return this.settlementRepo.findOne({ where: { batchId: query.batchId } });
  }
}
