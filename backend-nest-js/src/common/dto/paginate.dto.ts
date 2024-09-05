import { IsInt, IsObject, IsOptional, IsPositive } from 'class-validator';
import { Expose } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginateOptions } from '../type/orm.type';
import { OrderByDirection } from 'firebase-admin/lib/firestore';

export class PaginateDto<T> implements PaginateOptions<T> {
  @IsObject()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  orderBy: { field: keyof T; value: OrderByDirection };

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