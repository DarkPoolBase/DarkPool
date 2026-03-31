import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsValidOrderSide(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidOrderSide',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: 'Order side must be BUY or SELL',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          return value === 'BUY' || value === 'SELL';
        },
      },
    });
  };
}

