import { CanActivate, ExecutionContext, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrdersService } from '../orders.service';

@Injectable()
export class OrderOwnerGuard implements CanActivate {
  constructor(private ordersService: OrdersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;
    const orderId = request.params?.id;

    if (!userId || !orderId) {
      throw new ForbiddenException('Missing authentication or order ID');
    }

    try {
      const order = await this.ordersService.findById(orderId);
      if (order.userId !== userId) {
        throw new ForbiddenException('Not authorized to access this order');
      }
      request.order = order;
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new ForbiddenException('Not authorized to access this order');
    }
  }
}
