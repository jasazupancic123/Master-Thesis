import { PickType } from '@nestjs/mapped-types';
import { TrainingExercise } from '../entity/training-exercise.entity';
import { CreateTrainingExercise } from '../type/training-exercise.type';
import { ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SubgroupIdDto } from 'src/common/dto/subgroup-id.dto';

export class AddTrainingExerciseDto
  extends PickType(TrainingExercise, ['id', 'meta', 'color'])
  implements Omit<CreateTrainingExercise, 'membersIds'> {}

export class AddTrainingExercisesDto extends SubgroupIdDto {
  @ValidateNested({ each: true })
  @Type(() => AddTrainingExerciseDto)
  @ApiProperty()
  @Expose()
  exercises: AddTrainingExerciseDto[];
}
