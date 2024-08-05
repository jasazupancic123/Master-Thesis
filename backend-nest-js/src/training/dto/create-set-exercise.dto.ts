import { IntersectionType, OmitType, PickType } from '@nestjs/mapped-types';
import { SetExerciseEntity } from '../entity/set-exercise.entity';
import { ArrayNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { SuperExerciseInfoEntity } from '../entity/super-exercise-info.entity';

export class AddExerciseToSetSubgroupDto extends IntersectionType(
  PickType(SetExerciseEntity, ['order'] as const),
  OmitType(SuperExerciseInfoEntity, ['id', 'setExerciseId', 'createdAt', 'updatedAt'] as const),
) {
  @IsString({ each: true })
  @ArrayNotEmpty()
  @ApiProperty()
  @Expose()
  exerciseIds: string[];
}