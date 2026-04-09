import { GetRecentSettlementsHandler } from './get-recent-settlements.query';
import { GetSettlementHandler } from './get-settlement.query';

export { GetRecentSettlementsQuery, GetRecentSettlementsHandler } from './get-recent-settlements.query';
export { GetSettlementQuery, GetSettlementHandler } from './get-settlement.query';

export const SettlementQueryHandlers = [
  GetRecentSettlementsHandler,
  GetSettlementHandler,
];
