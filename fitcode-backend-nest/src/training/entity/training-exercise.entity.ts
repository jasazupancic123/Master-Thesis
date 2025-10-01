import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { Attribute } from '@src/attribute/entity/attribute.entity';
import { IdEntity } from '@src/common/entity/id.entity';

import { ExerciseSet } from './exercise-set.entity';

export class TrainingExercise extends IdEntity {
  @ValidateNested({ each: true })
  @Type(() => Attribute)
  @ApiProperty({ type: () => Attribute, isArray: true })
  @Expose()
  params: Attribute[]; // inferred from root component

  @ValidateNested({ each: true })
  @Type(() => ExerciseSet)
  @ApiProperty({ type: () => ExerciseSet, isArray: true })
  @Expose()
  sets: ExerciseSet[];
}
