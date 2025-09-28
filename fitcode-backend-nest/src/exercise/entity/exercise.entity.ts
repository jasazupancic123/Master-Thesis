import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { Attribute } from '@src/attribute/entity/attribute.entity';
import { BaseEntity } from '@src/common/entity/base.entity';
import { Institution } from '@src/institution/entity/institution.entity';

import { ExerciseAttributes } from './exercise-attributes.entity';

export class Exercise extends IntersectionType(BaseEntity, ExerciseAttributes) {
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

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Expose()
  @ApiPropertyOptional()
  institutionId?: string;
  institution?: Institution;

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
  @Expose()
  @ApiProperty()
  instruction?: string;

  @Type(() => Attribute)
  @IsOptional()
  defaultParams?: Attribute[]; // for frontend display, not stored in db

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
