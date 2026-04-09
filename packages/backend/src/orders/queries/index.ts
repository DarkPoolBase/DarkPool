import { GetOrdersHandler } from './get-orders.query';
import { GetOrderHandler } from './get-order.query';
import { GetOrderStatsHandler } from './get-order-stats.query';
import { GetActiveOrdersByGpuHandler } from './get-active-orders-by-gpu.query';

export { GetOrdersQuery, GetOrdersHandler } from './get-orders.query';
export { GetOrderQuery, GetOrderHandler } from './get-order.query';
export { GetOrderStatsQuery, GetOrderStatsHandler } from './get-order-stats.query';
export { GetActiveOrdersByGpuQuery, GetActiveOrdersByGpuHandler } from './get-active-orders-by-gpu.query';

export const OrderQueryHandlers = [
  GetOrdersHandler,
  GetOrderHandler,
  GetOrderStatsHandler,
  GetActiveOrdersByGpuHandler,
];
