import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { SetData } from '../entity/set-data';

export class UpdateAthleteSetDataDto {
  @ValidateNested({ each: true })
  @Type(() => SetData)
  @ApiProperty()
  @Expose()
  sets: SetData[];
}
