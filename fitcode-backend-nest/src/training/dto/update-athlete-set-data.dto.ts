import { ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { SetData } from '../entity/set-data';
import { ApiProperty } from '@nestjs/swagger';
import { SubgroupIdDto } from 'src/common/dto/subgroup-id.dto';

export class UpdateAthleteSetDataDto extends SubgroupIdDto {
  @ValidateNested({ each: true })
  @Type(() => SetData)
  @ApiProperty()
  @Expose()
  sets: SetData[];
}
