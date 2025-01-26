import { ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { ExerciseSetData } from '../entity/training-exercise-user-data.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAthleteSetDataDto {
  @ValidateNested({ each: true })
  @Type(() => ExerciseSetData)
  @ApiProperty()
  @Expose()
  sets: ExerciseSetData[];
}
