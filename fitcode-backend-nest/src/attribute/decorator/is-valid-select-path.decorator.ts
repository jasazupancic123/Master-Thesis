import type { ValidationArguments, ValidationOptions } from 'class-validator';
import { registerDecorator } from 'class-validator';

import type { Attribute } from '@src/attribute/entity/attribute.entity';
import type { ValidationResult } from '@src/attribute/util/attribute.util';
import { checkPathWithNextOptions } from '@src/attribute/util/attribute.util';

export function IsValidSelectPath(
  tree: Attribute[],
  options?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidEquipmentPathWithHint',
      target: object.constructor,
      propertyName: propertyName,
      options,
      constraints: [tree],
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          const [tree] = args.constraints as [Attribute[]];
          const result = checkPathWithNextOptions(value, tree);

          (args as any).validationResult = result;
          return result.isValid;
        },
        defaultMessage(args: ValidationArguments) {
          const validationResult = (args as any)
            .validationResult as ValidationResult;

          if (!validationResult.isValid) {
            const nextOptions =
              validationResult.nextOptions.length > 0
                ? validationResult.nextOptions.join(', ')
                : 'no further options';

            return `${args.value} is invalid. Last valid path: "${validationResult.lastValidPath}". Next possible options: ${nextOptions}`;
          }

          return '';
        },
      },
    });
  };
}
