import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class SetReport {
  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  reps: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  load: number; // in kg

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  tut: number; // total time under tension

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  tonnage: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  time: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  dist: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  recTime: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  recDist: number;
}
