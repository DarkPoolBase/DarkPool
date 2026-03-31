import { MatchedPair } from '../types/batch-result.interface';
import { OrderBookEntry } from '../types/order-book.interface';

/**
 * Match buy and sell orders at the clearing price.
 * V1: 1:1 matching, all-or-nothing fills.
 * V2: Will support partial fills and pro-rata allocation.
 */
export function matchOrders(
  bids: OrderBookEntry[],
  asks: OrderBookEntry[],
  clearingPrice: number,
): {
  matchedPairs: MatchedPair[];
  unmatchedBids: string[];
  unmatchedAsks: string[];
} {
  const eligibleBids = bids.filter((o) => o.price >= clearingPrice);
  const eligibleAsks = asks.filter((o) => o.price <= clearingPrice);

  const pairCount = Math.min(eligibleBids.length, eligibleAsks.length);
  const matchedPairs: MatchedPair[] = [];

  for (let i = 0; i < pairCount; i++) {
    matchedPairs.push({
      buyOrderId: eligibleBids[i].id,
      sellOrderId: eligibleAsks[i].id,
      buyerWallet: eligibleBids[i].wallet,
      sellerWallet: eligibleAsks[i].wallet,
      quantity: Math.min(eligibleBids[i].quantity, eligibleAsks[i].quantity),
      duration: Math.min(eligibleBids[i].duration, eligibleAsks[i].duration),
    });
  }

  return {
    matchedPairs,
    unmatchedBids: eligibleBids.slice(pairCount).map((o) => o.id),
    unmatchedAsks: eligibleAsks.slice(pairCount).map((o) => o.id),
  };
}

