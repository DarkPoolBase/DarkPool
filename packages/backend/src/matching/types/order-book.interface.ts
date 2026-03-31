export interface OrderBookEntry {
  id: string;
  wallet: string;
  price: number;
  quantity: number;
  duration: number;
  gpuHours: number;
}

export interface OrderBook {
  gpuType: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  depth: { bids: number; asks: number };
}

