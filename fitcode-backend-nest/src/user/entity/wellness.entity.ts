import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class Wellness {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  userId: string;

  @IsDate()
  @ApiProperty()
  @Transform(({ value }) => new Date(value))
  @Expose()
  date: Date;

  @IsOptional()
  @IsNumber()
  @Expose()
  @ApiPropertyOptional()
  @Min(0)
  @Max(500)
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Expose()
  @ApiPropertyOptional()
  @Min(0)
  @Max(250)
  height?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  @Expose()
  sleep?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  @Expose()
  fatigue?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  @Expose()
  soreness?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  @Expose()
  comment?: string;
}
