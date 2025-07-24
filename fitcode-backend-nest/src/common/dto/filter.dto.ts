import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { IsArray, IsOptional, validateSync } from 'class-validator';

/**
 * Base DTO class for filtering.
 * Extend this class for specific filter DTOs.
 */
export class BaseFilterDto {
  @IsOptional()
  @IsArray()
  ids?: string[];

  static fromQuery<T extends object>(
    query: Record<string, unknown>,
    type: new () => T,
  ): T {
    const instance = plainToInstance(type, query, {
      enableImplicitConversion: true,
    });

    const errors = validateSync(instance);
    if (errors.length > 0)
      throw new Error(`Validation failed: ${JSON.stringify(errors)}`);

    return instance;
  }
}

/**
 * Custom decorator to parse and validate filter DTOs.
 */
export const FilterDto = <T extends object>(type: new () => T) =>
  createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return BaseFilterDto.fromQuery(request.query, type);
  })();
