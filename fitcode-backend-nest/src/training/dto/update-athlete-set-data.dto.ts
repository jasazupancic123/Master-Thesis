import { ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { SetData } from '../entity/set-data';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAthleteSetDataDto {
  @ValidateNested({ each: true })
  @Type(() => SetData)
  @ApiProperty()
  @Expose()
  sets: SetData[];
}
