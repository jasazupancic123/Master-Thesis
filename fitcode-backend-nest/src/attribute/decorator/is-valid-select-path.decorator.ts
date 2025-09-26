import type { ValidationArguments, ValidationOptions } from 'class-validator';
import { registerDecorator } from 'class-validator';

import type { Attribute } from '@src/attribute/entity/attribute.entity';
import { checkPathWithNextOptions } from '@src/attribute/util/attribute.util';

export function IsValidSelectPath(
  tree: Attribute[],
  options?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsValidSelectPath',
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
          const key = args.property;
          const value = (args.value ?? '').toString();
          const [tree] = args.constraints as [Attribute[]];

          const result = checkPathWithNextOptions(value, tree);
          const { lastValidPath, nextOptions } = result;
          const nextOptionsShort = nextOptions.slice(0, 3).join(', ');
          const moreOptions = nextOptions.length > 3 ? ', ...' : '';

          return `${key} selection "${value}" is invalid, valid options for ${lastValidPath || key} are: ${nextOptionsShort}${moreOptions}`;
        },
      },
    });
  };
}
