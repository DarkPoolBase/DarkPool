import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

export class OrderNotFoundError extends NotFoundException {
  constructor(orderId: string) {
    super(`Order ${orderId} not found`);
  }
}

export class OrderNotActiveError extends BadRequestException {
  constructor(orderId: string, currentStatus: string) {
    super(`Cannot modify order ${orderId} with status ${currentStatus}. Only ACTIVE orders can be modified.`);
  }
}

export class OrderOwnershipError extends ForbiddenException {
  constructor() {
    super('Not authorized to access this order');
  }
}

export class InvalidOrderInputError extends BadRequestException {
  constructor(field: string, message: string) {
    super(`Invalid ${field}: ${message}`);
  }
}

