import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

import { Wellness } from './wellness.entity';

export class WellnessZScore extends Wellness {
  @IsNumber()
  @ApiProperty()
  @Expose()
  sleepZScore?: number;

  @IsNumber()
  @ApiProperty()
  @Expose()
  fatigueZScore?: number;

  @IsNumber()
  @ApiProperty()
  @Expose()
  sorenessZScore?: number;
}
