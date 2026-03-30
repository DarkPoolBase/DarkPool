import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface X402PaymentRequest {
  amount: string;
  currency: string;
  recipientAddress: string;
  description: string;
}

interface X402PaymentResult {
  paymentId: string;
  status: 'completed' | 'pending' | 'failed';
  txHash?: string;
  amount: string;
  currency: string;
}

/**
 * x402 Payment Protocol integration for HTTP-native machine-to-machine payments.
 * Enables AI agents to pay for compute via the HTTP 402 Payment Required flow.
 *
 * Flow:
 * 1. Agent sends request to a protected endpoint
 * 2. Server responds with 402 + x402 payment requirements header
 * 3. Agent submits payment via x402 protocol (USDC on Base)
 * 4. Server verifies payment and fulfills request
 */
@Injectable()
export class X402Service {
  private readonly logger = new Logger(X402Service.name);

  constructor(private config: ConfigService) {}

  /**
   * Generate x402 payment requirements for a protected endpoint.
   * Returns headers that tell the agent how to pay.
   */
  generatePaymentRequirements(
    amount: string,
    description: string,
  ): Record<string, string> {
    const recipientAddress = this.config.get<string>(
      'X402_RECIPIENT_ADDRESS',
      '0x0000000000000000000000000000000000000000',
    );
    const chainId = this.config.get<string>('CHAIN_ID', '8453');
    const usdcAddress = this.config.get<string>(
      'USDC_ADDRESS',
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    );

    return {
      'X-Payment-Required': 'true',
      'X-Payment-Amount': amount,
      'X-Payment-Currency': 'USDC',
      'X-Payment-Token': usdcAddress,
      'X-Payment-Chain': chainId,
      'X-Payment-Recipient': recipientAddress,
      'X-Payment-Description': description,
      'X-Payment-Protocol': 'x402',
    };
  }

  /**
   * Verify an x402 payment was completed on-chain.
   */
  async verifyPayment(txHash: string, expectedAmount: string): Promise<boolean> {
    this.logger.log(`Verifying x402 payment: ${txHash} for ${expectedAmount} USDC`);

    // TODO: Use viem to verify the transaction on Base
    // 1. Fetch transaction receipt
    // 2. Decode USDC transfer event
    // 3. Verify amount matches expected
    // 4. Verify recipient matches our address
    // 5. Verify sufficient confirmations

    return true;
  }

  /**
   * Process a payment request from an AI agent.
   */
  async processPayment(request: X402PaymentRequest): Promise<X402PaymentResult> {
    this.logger.log(
      `Processing x402 payment: ${request.amount} ${request.currency} to ${request.recipientAddress}`,
    );

    // TODO: Implement full x402 payment processing
    // 1. Validate payment parameters
    // 2. Monitor for on-chain payment
    // 3. Verify and confirm
    // 4. Credit the agent's account

    return {
      paymentId: `pay_${Date.now()}`,
      status: 'pending',
      amount: request.amount,
      currency: request.currency,
    };
  }

  /**
   * Get pricing for a compute endpoint.
   * Used to calculate x402 payment amounts for agent requests.
   */
  getEndpointPricing(endpoint: string): { amount: string; currency: string } {
    const pricing: Record<string, string> = {
      '/api/orders': '0.01',
      '/api/market/prices': '0.001',
      '/api/providers': '0.001',
      '/api/inference/submit': '0.05',
    };

    return {
      amount: pricing[endpoint] ?? '0.001',
      currency: 'USDC',
    };
  }
}
