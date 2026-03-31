import { MATCHING_CONSTANTS } from '../constants';

/**
 * Calculate protocol fee for a batch settlement
 */
export function calculateBatchFee(
  totalValueUSDC: number,
  feeBps: number = MATCHING_CONSTANTS.PROTOCOL_FEE_BPS,
): number {
  return (totalValueUSDC * feeBps) / MATCHING_CONSTANTS.BPS_DENOMINATOR;
}

/**
 * Calculate the total value of a batch in USDC
 */
export function calculateBatchValue(
  matchedVolume: number,
  clearingPrice: number,
): number {
  return matchedVolume * clearingPrice;
}

