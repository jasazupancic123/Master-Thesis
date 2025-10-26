import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { BaseEntity } from '@src/common/entity/base.entity';
import { Institution } from '@src/institution/entity/institution.entity';
import { ExerciseParamField } from '@src/training/entity/exercise-set.entity';

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

  @IsString({ each: true })
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  componentIds: string[]; // first component is necessary and cannot be changed, others are for "tags"

  @IsBoolean()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional()
  isUnilateral: boolean; // exercise can be performed with both sides of the body separately, like a single arm row

  @IsBoolean()
  @Expose()
  @ApiProperty()
  disabled: boolean; // exercise is disabled and cannot be used for new programs, but existing programs are not affected

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Expose()
  @ApiProperty()
  params: ExerciseParamField[];
}
