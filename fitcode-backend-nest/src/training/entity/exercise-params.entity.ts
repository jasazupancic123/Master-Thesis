import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AttributeValue } from './attribute-value.entity';

// NOTE - any values that are represented in % are NOT normalized between 0 and 1 (BW, INT, RM, ...)

export class ExerciseParams {
  @IsInt()
  @Min(0)
  @ApiProperty()
  @Expose()
  set: number; // number of sets

  @IsInt()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional()
  @Expose()
  rec?: number; // recovery

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  setType: string;

  @IsInt()
  @Min(0)
  @ApiProperty()
  @Expose()
  setTypeValue: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  workloadType?: string;

  @IsInt()
  @Min(0)
  @ApiProperty()
  @Expose()
  workloadValue: number;

  @ValidateNested({ each: true })
  @Type(() => AttributeValue)
  @ApiPropertyOptional()
  @Expose()
  otherParams?: AttributeValue[];
}
