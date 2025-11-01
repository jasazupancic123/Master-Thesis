import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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

  @IsBoolean()
  @Expose()
  @ApiProperty()
  disabled: boolean; // exercise is disabled and cannot be used for new programs, but existing programs are not affected
}
