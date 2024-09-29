import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class TimestampEntity {
  @IsDate()
  @ApiProperty()
  @Transform(({ value }) => new Date(value))
  @Expose()
  createdAt: Date;

  @IsDate()
  @ApiProperty()
  @Transform(({ value }) => new Date(value))
  @Expose()
  updatedAt: Date;

  @IsDate()
  @IsOptional()
  @ApiPropertyOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @Expose()
  deletedAt?: Date;
}
