import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { X402Service } from './x402.service';

export const X402_ENDPOINT = 'x402_endpoint';

/** Decorate a route handler to require x402 USDC payment before access */
export const RequireX402Payment = (endpoint: string) =>
  SetMetadata(X402_ENDPOINT, endpoint);

/**
 * x402 Guard — intercepts requests and returns HTTP 402 with payment
 * requirements if the caller hasn't included a verified payment tx hash.
 *
 * Usage:
 *   @UseGuards(X402Guard)
 *   @RequireX402Payment('/api/orders')
 *   @Post()
 *   async createOrder() { ... }
 *
 * Agent flow:
 *   1. Agent hits endpoint → gets 402 + X-Payment-* headers
 *   2. Agent sends USDC on Base
 *   3. Agent retries with X-Payment-Tx: <txHash> header
 *   4. Guard verifies on-chain → allows request through
 */
@Injectable()
export class X402Guard implements CanActivate {
  constructor(
    private readonly x402Service: X402Service,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const endpoint = this.reflector.get<string>(
      X402_ENDPOINT,
      context.getHandler(),
    );

    // No payment required for this route
    if (!endpoint) return true;

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();

    const paymentTxHash = request.headers['x-payment-tx'] as string | undefined;
    const paymentAmount = request.headers['x-payment-amount'] as string | undefined;

    // No payment header — return 402 with requirements
    if (!paymentTxHash) {
      const pricing = this.x402Service.getEndpointPricing(endpoint);
      const headers = this.x402Service.generatePaymentRequirements(
        pricing.amount,
        `Access to ${endpoint}`,
      );

      Object.entries(headers).forEach(([key, value]) => {
        response.setHeader(key, value);
      });

      response.status(402).json({
        error: 'Payment Required',
        amount: pricing.amount,
        currency: pricing.currency,
        protocol: 'x402',
        instructions:
          'Send USDC on Base to the X-Payment-Recipient address, then retry with X-Payment-Tx header containing the transaction hash.',
      });

      return false;
    }

    // Verify the payment on-chain
    const expectedAmount =
      paymentAmount ?? this.x402Service.getEndpointPricing(endpoint).amount;

    const verified = await this.x402Service.verifyPayment(
      paymentTxHash,
      expectedAmount,
    );

    if (!verified) {
      response.status(402).json({
        error: 'Payment verification failed',
        txHash: paymentTxHash,
        protocol: 'x402',
      });
      return false;
    }

    return true;
  }
}
