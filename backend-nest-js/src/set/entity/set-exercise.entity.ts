import { BaseEntity } from '../../common/entity/base.entity';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Exercise } from '../../exercise/entity/exercise.entity';
import { ExerciseInfoEntity } from '../../exercise-info/entity/exercise-info.entity';
import { Expose } from 'class-transformer';
import { Entity } from '../../common/decorator/entity.decorator';
import { SET_EXERCISE_COLLECTION } from '../../common/const/firestore.const';
import { SuperExerciseInfoEntity } from '../../exercise-info/entity/super-exercise-info.entity';

@Entity(SET_EXERCISE_COLLECTION)
export class SetExerciseEntity extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  setSubgroupId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  exerciseId: string;

  @IsInt()
  @Min(0)
  @ApiProperty()
  @Expose()
  order: number;

  // relations
  exercise: Exercise;
  superExerciseInfo: SuperExerciseInfoEntity;
  exerciseInfo: ExerciseInfoEntity[];
}