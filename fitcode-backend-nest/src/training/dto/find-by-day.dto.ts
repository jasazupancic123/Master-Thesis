import { IsDate, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class FindByDayDto {
  @IsDate()
  @ApiProperty()
  @Transform(({ value }) => new Date(value))
  @Expose()
  day: Date;
}
