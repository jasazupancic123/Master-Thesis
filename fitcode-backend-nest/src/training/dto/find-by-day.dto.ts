import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsDate } from 'class-validator';

export class FindByDayDto {
  @IsDate()
  @ApiProperty()
  @Transform(({ value }) => new Date(value))
  @Expose()
  day: Date;
}
