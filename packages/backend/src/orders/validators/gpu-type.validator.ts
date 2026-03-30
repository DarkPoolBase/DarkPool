import { registerDecorator, ValidationOptions } from 'class-validator';

const VALID_GPU_TYPES = ['H100', 'A100', 'RTX4090', 'L40S', 'H200', 'A10G'];

export function IsValidGpuType(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidGpuType',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: `GPU type must be one of: ${VALID_GPU_TYPES.join(', ')}`,
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          return typeof value === 'string' && VALID_GPU_TYPES.includes(value);
        },
      },
    });
  };
}
