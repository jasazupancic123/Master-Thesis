import { IntersectionType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { AttributeValue } from '@src/attribute/entity/attribute-value.entity';

export class ExerciseAttributeValue extends IntersectionType(AttributeValue) {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  id: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiProperty()
  @Expose()
  exerciseId: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Expose()
  @ApiProperty()
  ownerId: string;

  @IsString({ each: true })
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  componentIds: string[]; // first component is necessary and cannot be changed, others are for "tags"

  @IsBoolean()
  @IsOptional()
  @Expose()
  @ApiProperty()
  isUnilateral: boolean; // exercise can be performed with both sides of the body separately, like a single arm row
}
