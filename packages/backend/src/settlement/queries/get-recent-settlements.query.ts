import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settlement } from '../../indexer/entities/settlement.entity';

export class GetRecentSettlementsQuery implements IQuery {
  constructor(public readonly limit: number = 20) {}
}

@QueryHandler(GetRecentSettlementsQuery)
export class GetRecentSettlementsHandler implements IQueryHandler<GetRecentSettlementsQuery> {
  constructor(
    @InjectRepository(Settlement) private settlementRepo: Repository<Settlement>,
  ) {}

  async execute(query: GetRecentSettlementsQuery): Promise<Settlement[]> {
    return this.settlementRepo.find({
      order: { createdAt: 'DESC' },
      take: query.limit,
    });
  }
}
