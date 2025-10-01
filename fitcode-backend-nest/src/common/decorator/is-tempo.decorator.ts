import type { ValidationArguments, ValidationOptions } from 'class-validator';
import { registerDecorator } from 'class-validator';

export function IsTempo(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isTempo',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          // must be 4 parts, separated by ":"
          const parts = value.split(':');
          if (parts.length !== 4) return false;

          // Each part must be a valid number (int or float, >= 0)
          return parts.every((p) => {
            const num = Number(p);
            return !isNaN(num) && num >= 0;
          });
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid tempo string in format "eccentric:pauseBottom:concentric:pauseTop", e.g. "2.5:0:3.5:0"`;
        },
      },
    });
  };
}
