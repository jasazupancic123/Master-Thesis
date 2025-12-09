import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

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

  @IsNumber()
  @Min(0)
  @Max(2)
  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  coeffRel?: number;
  // eg. incline dumbell bench press has relative coefficient 66% to flat barbell bench press

  @IsNumber()
  @Min(0)
  @Max(1)
  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  coeffLoad?: number;
  // eg. squat has load coefficient 100% because the whole body is loaded
  // eg. bicep curl has load coefficient 15% because only a small part of the body is loaded

  @IsNumber()
  @Min(0)
  @Max(1)
  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  coeffBw?: number;
  // eg. push up has bodyweight coefficient 75% because approximately 3/4 of the bodyweight is lifted
  // eg. pull up has bodyweight coefficient 85% because forearms are not lifted

  @IsNumber()
  @Min(0)
  @Max(4)
  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  coeff1Rm?: number;
  // eg. deadlift has 1RM coefficient 2.5 because it is generally possible to deadlift 2.5x bodyweight
  // eg. overhead press has 1RM coefficient 0.75 because it is generally possible to overhead press 0.75x bodyweight
}
