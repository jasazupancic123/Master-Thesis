import { IsDate, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class Bodyweight {
  @IsNumber()
  @ApiProperty()
  @Expose()
  weight: number;

  @IsDate()
  @ApiProperty()
  @Transform(({ value }) => new Date(value))
  @Expose()
  date: Date;
}
