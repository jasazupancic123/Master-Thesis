import { OmitType } from '@nestjs/mapped-types';
import { ArrayNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { SuperExerciseInfo } from '../../exercise-info/entity/super-exercise-info.entity';

export class AddSetExerciseDto extends OmitType(
  SuperExerciseInfo, ['id', 'setExerciseId', 'createdAt', 'updatedAt'] as const,
) {
  @IsString({ each: true })
  @ArrayNotEmpty()
  @ApiProperty()
  @Expose()
  exerciseIds: string[];
}