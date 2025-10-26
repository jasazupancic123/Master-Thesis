import type { ValidationArguments, ValidationOptions } from 'class-validator';
import { registerDecorator } from 'class-validator';

import { AttributeType } from '@src/common/enum/attribute-type.enum';

export function IsValidDefaultValue(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsDefaultValueValid',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj: any = args.object;
          const type = obj.type;

          // allow undefined/null since it's optional
          if (value === undefined || value === null) return true;

          switch (type) {
            case AttributeType.Number:
              return typeof value === 'number' || Number.isNaN(value) === false;
            case AttributeType.Boolean:
              return typeof value === 'boolean';
            case AttributeType.String:
            case AttributeType.Value:
              return typeof value === 'string';
            default:
              return true; // don’t fail validation for other types (e.g. Select, Multiselect)
          }
        },
        defaultMessage(args: ValidationArguments) {
          const obj: any = args.object;
          const type = obj.type;

          switch (type) {
            case AttributeType.Number:
              return `${args.property} must be a number when type is "number"`;
            case AttributeType.Boolean:
              return `${args.property} must be a boolean when type is "boolean"`;
            case AttributeType.String:
            case AttributeType.Value:
              return `${args.property} must be a string when type is "${type}"`;
            default:
              return `${args.property} has an invalid defaultValue type`;
          }
        },
      },
    });
  };
}
