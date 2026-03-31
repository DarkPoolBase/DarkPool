interface PriceCandidate {
  price: number;
  gpuHours: number;
}

/**
 * Find the uniform clearing price that maximizes matched volume.
 * This is the core of the batch auction algorithm.
 *
 * Algorithm:
 * 1. Collect all unique prices from buy and sell orders
 * 2. For each candidate price, compute demand (buys >= price) and supply (sells <= price)
 * 3. Matched volume at each price = min(demand, supply)
 * 4. Return price that maximizes matched volume
 * 5. Tie-break: prefer higher price (benefits sellers, incentivizes supply)
 */
export function findClearingPrice(
  bids: PriceCandidate[],
  asks: PriceCandidate[],
): number | null {
  const candidatePrices = new Set<number>();
  for (const o of bids) candidatePrices.add(o.price);
  for (const o of asks) candidatePrices.add(o.price);

  const prices = Array.from(candidatePrices).sort((a, b) => a - b);

  let bestPrice: number | null = null;
  let bestVolume = 0;

  for (const price of prices) {
    const demand = bids
      .filter((o) => o.price >= price)
      .reduce((sum, o) => sum + o.gpuHours, 0);

    const supply = asks
      .filter((o) => o.price <= price)
      .reduce((sum, o) => sum + o.gpuHours, 0);

    const matched = Math.min(demand, supply);

    if (matched > bestVolume || (matched === bestVolume && bestPrice !== null && price > bestPrice)) {
      bestVolume = matched;
      bestPrice = price;
    }
  }

  return bestVolume > 0 ? bestPrice : null;
}

