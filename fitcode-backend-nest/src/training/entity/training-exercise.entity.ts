import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, ValidateNested } from 'class-validator';

import { Attribute } from '@src/attribute/entity/attribute.entity';
import { ColorEntity } from '@src/common/entity/color.entity';
import { IdEntity } from '@src/common/entity/id.entity';

import { ExerciseSet } from './exercise-set.entity';

export class TrainingExercise extends IntersectionType(IdEntity, ColorEntity) {
  @ValidateNested({ each: true })
  @Type(() => Attribute)
  @ApiProperty()
  @Expose()
  params: Attribute[];

  @ValidateNested({ each: true })
  @Type(() => ExerciseSet)
  @ApiProperty()
  @Expose()
  sets: ExerciseSet[];

  @IsBoolean()
  @ApiProperty()
  @Expose()
  periodized: boolean;

  @ValidateNested({ each: true })
  @Type(() => Attribute)
  @ApiProperty()
  @Expose()
  attributes: Attribute[];
}
