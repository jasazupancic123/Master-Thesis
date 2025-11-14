import { BadRequestException } from '@nestjs/common';
import type { WhereFilterOp } from 'firebase-admin/firestore';

import type { ValidateError } from '@src/common/type/validate.type';

export class GenericUtil {
  /**
   * Converts the first letter of a string to lowercase.
   */
  lowerFirstLetter(str: string): string {
    if (!str) return str;
    return str[0].toLowerCase() + str.slice(1);
  }

  /**
   * Converts the first letter of a string to uppercase.
   */
  upperFirstLetter(str: string): string {
    if (!str) return str;
    return str[0].toUpperCase() + str.slice(1);
  }

  error(errors: ValidateError<any>[]): string {
    if (!errors.length) return '';
    return (
      this.upperFirstLetter(errors[0].message) +
      (errors.length > 1 ? ` (and ${errors.length - 1} more errors)` : '')
    );
  }

  async measure<T>(
    label: string,
    fn: () => Promise<T>,
    round: (n: number) => number = (n) => Math.round(n),
  ): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      if (process.env.NODE_ENV !== 'test')
        // eslint-disable-next-line no-console
        console.log(`${label} took ${round(duration)}ms`);
    }
  }
}

export function parseQueryArray(value: string): string[] {
  if (!value) return [];

  try {
    return value.split(',') || [];
  } catch (_e) {
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
  if (!condition) return undefined;

  try {
    condition.split(':');
  } catch (_e) {
    throw new BadRequestException(
      'Invalid query condition, must be in the format of ?<field>:<operator>:<value>',
    );
  }

  const parts = condition.split(':');
  if (!parts.length || parts.length !== 3)
    throw new BadRequestException(
      'Invalid query condition, must be in the format of ?<field>:<operator>:<value>',
    );

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

  return { op, value } as { op: WhereFilterOp; value: unknown };
}
