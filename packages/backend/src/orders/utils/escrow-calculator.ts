export function calculateEscrowAmount(
  quantity: number,
  pricePerHour: number,
  duration: number,
): number {
  return quantity * pricePerHour * duration;
}

export function calculateProtocolFee(
  tradeValue: number,
  feeBps: number = 80,
): number {
  return (tradeValue * feeBps) / 10000;
}

export function calculateRefund(
  escrowAmount: number,
  clearingPrice: number,
  quantity: number,
  duration: number,
): number {
  const actualCost = clearingPrice * quantity * duration;
  return Math.max(0, escrowAmount - actualCost);
}
