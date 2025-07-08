import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { PickType } from '@nestjs/mapped-types';
import { TrainingExercise } from './training-exercise.entity';
import { IdEntity } from '../../common/entity/id.entity';

export class CompletedTrainingExercise extends PickType(TrainingExercise, [
  'sets',
] as const) {}

export class CompletedSuperset {
  @ValidateNested({ each: true })
  @Type(() => CompletedTrainingExercise)
  @ApiProperty()
  @Expose()
  exercises: CompletedTrainingExercise[];
}

export class CompletedTrainingComponent extends IdEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  userId?: string; // manager and trainer must pass athlete id

  @ValidateNested({ each: true })
  @Type(() => CompletedSuperset)
  @ApiProperty()
  @Expose()
  supersets: CompletedSuperset[];
}
