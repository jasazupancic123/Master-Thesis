import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class FindByDayAndPeriodDto {
  @IsDate()
  @ApiProperty()
  @Transform(({ value }) => new Date(value))
  @Expose()
  day: Date;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  period: 'AM' | 'PM';
}
