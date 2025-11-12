import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

import { SetReport } from '../type/training-set.type';

export class PrescribedTrainingStats extends OmitType(SetReport, [
  'load',
] as const) {
  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  duration: number; // in minutes

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  components: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  supersets: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  exercises: number; // unique

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  sets: number;
}
