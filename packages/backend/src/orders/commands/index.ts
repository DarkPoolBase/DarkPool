import { CreateOrderHandler } from './create-order.command';
import { CancelOrderHandler } from './cancel-order.command';
import { FillOrdersHandler } from './fill-orders.command';

export { CreateOrderCommand, CreateOrderHandler } from './create-order.command';
export { CancelOrderCommand, CancelOrderHandler } from './cancel-order.command';
export { FillOrdersCommand, FillOrdersHandler } from './fill-orders.command';

export const OrderCommandHandlers = [
  CreateOrderHandler,
  CancelOrderHandler,
  FillOrdersHandler,
];
