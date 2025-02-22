import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { BaseEntity } from '../../common/entity/base.entity';
import { ExerciseAttributeValue } from './exercise-attribute-value.entity';

export class Exercise extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  name: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Expose()
  @ApiProperty()
  componentsIds: string[];

  @IsBoolean()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  global: boolean;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Expose()
  @ApiPropertyOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Expose()
  @ApiPropertyOptional()
  videoUrl?: string;

  @ValidateNested({ each: true })
  @Type(() => ExerciseAttributeValue)
  @ApiProperty()
  @Expose()
  values: ExerciseAttributeValue[]; // sub collection where each document has attribute id and value

  attributeValues?: Record<string, any>; // for nested object display for frontend
}
