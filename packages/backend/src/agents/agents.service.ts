import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../orders/orders.service';
import { keccak256, encodePacked, toHex } from 'viem';

export interface AgentOrder {
  gpuType: string;
  quantity: number;
  maxPrice: string;
  duration: number;
}

export interface AgentOrderResult {
  orderId: string;
  status: string;
  escrowAmount: string;
  estimatedClearingPrice: string;
}

export interface AgentBalance {
  available: string;
  locked: string;
  currency: string;
}

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(
    private config: ConfigService,
    private ordersService: OrdersService,
  ) {}

  async submitAgentOrder(
    userId: string,
    agentWallet: string,
    order: AgentOrder,
  ): Promise<AgentOrderResult> {
    this.logger.log(
      `Agent ${agentWallet} submitting order: ${order.quantity} ${order.gpuType} @ max ${order.maxPrice}`,
    );

    // Generate a commitment hash from order params
    const secret = toHex(BigInt(Date.now()), { size: 32 });
    const commitmentHash = keccak256(
      encodePacked(
        ['string', 'uint256', 'uint256', 'uint256', 'bool', 'bytes32'],
        [
          order.gpuType,
          BigInt(order.quantity),
          BigInt(Math.round(parseFloat(order.maxPrice) * 1e6)),
          BigInt(order.duration),
          true, // agents always buy
          secret as `0x${string}`,
        ],
      ),
    );

    const created = await this.ordersService.create(userId, agentWallet, {
      side: 'BUY',
      gpuType: order.gpuType,
      quantity: order.quantity,
      pricePerHour: parseFloat(order.maxPrice),
      duration: order.duration,
      commitmentHash,
      encryptedDetails: `agent:${agentWallet}`,
    });

    return {
      orderId: created.id,
      status: created.status,
      escrowAmount: created.escrowAmount,
      estimatedClearingPrice: order.maxPrice,
    };
  }

  async getAgentBalance(agentWallet: string): Promise<AgentBalance> {
    this.logger.log(`Fetching balance for agent ${agentWallet}`);
    // TODO: Query Escrow contract for actual balances when deployed
    return { available: '0', locked: '0', currency: 'USDC' };
  }

  async getAgentOrders(
    userId: string,
  ): Promise<AgentOrderResult[]> {
    const result = await this.ordersService.findAllForUser(userId, { limit: 50 });

    return result.data.map((order) => ({
      orderId: order.id,
      status: order.status,
      escrowAmount: order.escrowAmount,
      estimatedClearingPrice: order.clearingPrice ?? order.pricePerHour,
    }));
  }

  async cancelAgentOrder(
    userId: string,
    orderId: string,
  ): Promise<{ success: boolean }> {
    await this.ordersService.cancel(orderId, userId);
    return { success: true };
  }
}

