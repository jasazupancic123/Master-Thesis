import { ClassConstructor, plainToInstance } from 'class-transformer';

import { PaginateOptions } from '../../type/orm.type';
import { BadRequestException } from '@nestjs/common';
import { WhereFilterOp } from 'firebase-admin/firestore';

export class GenericUtil {
  serializeToDto<T, V extends Array<unknown>>(
    dtoClass: ClassConstructor<T>,
    plain: V,
  ): T[];
  serializeToDto<T, V>(dtoClass: ClassConstructor<T>, plain: V): T;
  serializeToDto<T, V>(dtoClass: ClassConstructor<T>, plain: V | V[]): T | T[] {
    return plainToInstance(dtoClass, plain, { excludeExtraneousValues: true });
  }

  paginate<T>(data: T[], options: PaginateOptions<T> = {}): T[] {
    const { page, pageSize } = options;
    const start = (page - 1) * pageSize;
    const end = page * pageSize;
    return data.slice(start, end);
  }
}

export function parseQueryArray(value: string): string[] {
  try {
    return value.split(',') || [];
  } catch (e) {
    throw new BadRequestException(
      'Invalid query value, must be a comma-separated string',
    );
  }
}

/**
 * Parses a query condition string into an object with operator and value.
 * Example query: ?name:==:John
 */
export function parseQueryCondition(condition: string) {
  const error = new BadRequestException(
    'Invalid query condition, must be in the format of ?<field>:<operator>:<value>',
  );

  try {
    condition.split(':');
  } catch (e) {
    throw error;
  }

  const parts = condition.split(':');
  if (!parts.length || parts.length !== 3) throw error;

  const operators: WhereFilterOp[] = [
    '==',
    '!=',
    '>',
    '>=',
    '<',
    '<=',
    'array-contains',
    'in',
    'array-contains-any',
    'not-in',
  ];

  const [_, op, value] = parts;
  if (!operators.includes(op as WhereFilterOp))
    throw new BadRequestException(
      `Invalid operator, must be one of ${operators.join(', ')}`,
    );

  return { op, value } as { op: WhereFilterOp; value: any };
}
