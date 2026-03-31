import { Order } from '../../orders/entities/order.entity';
import { OrderBook, OrderBookEntry } from '../types/order-book.interface';

/**
 * Build a structured order book from raw order entities
 */
export function buildOrderBook(gpuType: string, orders: Order[]): OrderBook {
  const toEntry = (o: Order): OrderBookEntry => ({
    id: o.id,
    wallet: o.walletAddress,
    price: parseFloat(o.pricePerHour),
    quantity: o.quantity,
    duration: o.duration,
    gpuHours: o.quantity * o.duration,
  });

  const bids = orders
    .filter((o) => o.side === 'BUY')
    .map(toEntry)
    .sort((a, b) => b.price - a.price);

  const asks = orders
    .filter((o) => o.side === 'SELL')
    .map(toEntry)
    .sort((a, b) => a.price - b.price);

  const bestBid = bids.length > 0 ? bids[0].price : null;
  const bestAsk = asks.length > 0 ? asks[0].price : null;
  const spread = bestBid !== null && bestAsk !== null ? bestAsk - bestBid : null;

  return {
    gpuType,
    bids,
    asks,
    bestBid,
    bestAsk,
    spread,
    depth: { bids: bids.length, asks: asks.length },
  };
}

