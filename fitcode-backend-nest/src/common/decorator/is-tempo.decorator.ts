import type { ValidationArguments, ValidationOptions } from 'class-validator';
import { registerDecorator } from 'class-validator';

import { TEMPO_REGEX } from '../constant/tempo-regex.constant';

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
          const regex = new RegExp(TEMPO_REGEX);
          return regex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid tempo string in the format "eccentric:pauseBottom:concentric:pauseTop" (e.g. "2.5:0:3.5:0")`;
        },
      },
    });
  };
}
