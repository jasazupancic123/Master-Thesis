import { ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { SetData } from '../entity/training-workload.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAthleteSetDataDto {
  @ValidateNested({ each: true })
  @Type(() => SetData)
  @ApiProperty()
  @Expose()
  sets: SetData[];
}
