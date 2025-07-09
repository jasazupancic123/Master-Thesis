import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { PickType } from '@nestjs/mapped-types';
import { TrainingExercise } from './training-exercise.entity';

export class CompletedTrainingExercise extends PickType(TrainingExercise, [
  'id',
  'sets',
] as const) {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  @Min(0)
  supersetIndex: number;
}

export class CompletedTrainingComponent {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  userId: string; // manager and trainer must pass athlete id

  @ValidateNested({ each: true })
  @Type(() => CompletedTrainingExercise)
  @ApiProperty()
  @Expose()
  exercises: CompletedTrainingExercise[];
}
