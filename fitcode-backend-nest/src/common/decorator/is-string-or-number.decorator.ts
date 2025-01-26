import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsStringOrNumber(validationOptions?: ValidationOptions) {
  return function(object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isStringOrNumber',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeof value === 'string' || typeof value === 'number';
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a string or a number`;
        },
      },
    });
  };
}