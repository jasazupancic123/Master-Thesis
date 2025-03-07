import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { ColorEntity } from '../../common/entity/color.entity';
import { IdEntity } from '../../common/entity/id.entity';
import { ExerciseParams } from './exercise-params.entity';

export class TrainingExercise extends IntersectionType(IdEntity, ColorEntity) {
  @ValidateNested()
  @Type(() => ExerciseParams)
  @ApiProperty()
  @Expose()
  params: ExerciseParams;
}
