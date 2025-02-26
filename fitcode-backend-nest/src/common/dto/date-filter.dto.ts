import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsDate, IsDateString, IsOptional, IsString } from 'class-validator';

export class DateFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  @Transform(({ value }) => {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  })
  from?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  @Transform(({ value }) => {
    if (value) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    }
  })
  to?: Date;
}
