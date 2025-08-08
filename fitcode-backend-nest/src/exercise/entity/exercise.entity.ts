import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Attribute } from '@src/attribute/entity/attribute.entity';
import { BaseEntity } from '@src/common/entity/base.entity';
import { ExerciseAttributeValue } from '@src/exercise/entity/exercise-attribute-value.entity';

export class Exercise extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  ownerId: string; // special 'global' string value for global exercises, institution id for institutions

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  name: string;

  @IsString({ each: true })
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  componentIds: string[]; // first component is necessary and cannot be changed, others are for "tags"

  @IsBoolean()
  @IsOptional()
  @Expose()
  @ApiProperty()
  isBilateral: boolean; // exercise can be performed with both sides of the body separately, like a single arm row

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

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  instruction?: string;

  @ValidateNested({ each: true })
  @Type(() => ExerciseAttributeValue)
  @ApiProperty({ type: () => ExerciseAttributeValue, isArray: true })
  @Expose()
  attributeValues: ExerciseAttributeValue[]; // sub collection for filtering

  @Type(() => Attribute)
  @IsOptional()
  defaultParams?: Attribute[];
}
