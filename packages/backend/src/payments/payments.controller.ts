import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { X402Service } from './x402.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly x402Service: X402Service) {}

  /**
   * Check payment status for an x402 payment.
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyPayment(@Body() body: { txHash: string; expectedAmount: string }) {
    const verified = await this.x402Service.verifyPayment(
      body.txHash,
      body.expectedAmount,
    );
    return { verified };
  }

  /**
   * Get x402 payment requirements for a given endpoint.
   * Agents call this to know how much to pay before accessing a premium endpoint.
   */
  @Post('requirements')
  @HttpCode(HttpStatus.PAYMENT_REQUIRED)
  async getRequirements(
    @Body() body: { endpoint: string },
    @Res() res: Response,
  ) {
    const pricing = this.x402Service.getEndpointPricing(body.endpoint);
    const headers = this.x402Service.generatePaymentRequirements(
      pricing.amount,
      `Access to ${body.endpoint}`,
    );

    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    res.status(402).json({
      error: 'Payment Required',
      ...pricing,
      protocol: 'x402',
    });
  }
}
