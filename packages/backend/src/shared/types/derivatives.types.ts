export interface PerpetualPosition {
  id: string;
  traderId: string;
  gpuType: string;
  side: 'LONG' | 'SHORT';
  size: number;
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  leverage: number;
  liquidationPrice: number;
  margin: number;
}

export interface OptionContract {
  id: string;
  gpuType: string;
  optionType: 'CALL' | 'PUT';
  strikePrice: number;
  expiryDate: string;
  premium: number;
  underlyingPrice: number;
}

export interface ForwardContract {
  id: string;
  gpuType: string;
  quantity: number;
  deliveryDate: string;
  forwardPrice: number;
  buyerAddress: string;
  sellerAddress: string;
  status: 'ACTIVE' | 'DELIVERED' | 'EXPIRED' | 'DEFAULTED';
}
