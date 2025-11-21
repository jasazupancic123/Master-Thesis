import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

import { Wellness } from './wellness.entity';

export class WellnessZScore extends Wellness {
  @IsNumber()
  @ApiProperty()
  @Expose()
  zScoreSleep?: number;

  @IsNumber()
  @ApiProperty()
  @Expose()
  zScoreFatigue?: number;

  @IsNumber()
  @ApiProperty()
  @Expose()
  zScoreSoreness?: number;
}
