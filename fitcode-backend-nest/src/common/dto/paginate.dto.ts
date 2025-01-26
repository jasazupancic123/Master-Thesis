import { IsInt, IsObject, IsOptional, IsPositive } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginateOptions } from '../type/orm.type';
import { BadRequestException } from '@nestjs/common';

export class PaginateDto<T> implements PaginateOptions<T> {
  @IsObject()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  @Transform(({ value }) => {
    if (!value) return undefined;

    try {
      const result = value.split(':') as [keyof T, 'asc' | 'desc'];

      if (
        !result.length ||
        result.length !== 2 ||
        !['asc', 'desc'].includes(result[1])
      )
        throw new Error();

      return { field: result[0], value: result[1] };
    } catch (e) {
      throw new BadRequestException(
        'Invalid orderBy query, use `orderBy=field:asc|desc`',
      );
    }
  })
  orderBy?: { field: keyof T; value: 'asc' | 'desc' };

  @IsInt()
  @IsOptional()
  @IsPositive()
  @ApiPropertyOptional()
  @Expose()
  page?: number;

  @IsInt()
  @IsOptional()
  @IsPositive()
  @ApiPropertyOptional()
  @Expose()
  pageSize?: number;
}
