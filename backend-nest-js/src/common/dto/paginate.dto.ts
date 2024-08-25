import { IsInt, IsObject, IsOptional, IsPositive } from 'class-validator';
import { Expose } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderBy, PaginateOptions } from '../type/paginate.type';

export class PaginateDto<T> implements PaginateOptions<T> {
  @IsObject()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  order: OrderBy<T>;

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

  @IsInt()
  @IsOptional()
  @IsPositive()
  @ApiPropertyOptional()
  @Expose()
  limit?: number;
}