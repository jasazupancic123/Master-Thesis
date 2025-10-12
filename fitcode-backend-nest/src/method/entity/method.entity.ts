import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Attribute } from '@src/attribute/entity/attribute.entity';
import { IdEntity } from '@src/common/entity/id.entity';
import { ExerciseSet } from '@src/training/entity/exercise-set.entity';

export class Method extends IdEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  componentId: string;

  @ValidateNested({ each: true })
  @Type(() => Attribute)
  @ApiProperty({ type: () => Attribute, isArray: true })
  @Expose()
  attributes: Attribute<ExerciseSet>[];

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  ability: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  intensity: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  recovery: string;

  @IsString()
  @ApiProperty()
  @Expose()
  @IsOptional()
  tempo: string;

  @IsString()
  @ApiProperty()
  @Expose()
  @IsOptional()
  repetition: string;

  @IsString()
  @ApiProperty()
  @Expose()
  @IsOptional()
  set: string;
}
