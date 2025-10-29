import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsIn } from 'class-validator';

import { IdEntity } from '@src/common/entity/id.entity';

import { MuscleTags } from '../const/muscle-tags.constant';

export class MuscleEntity extends IdEntity {
  @IsIn(MuscleTags, { each: true })
  @ApiProperty({ enum: MuscleTags, isArray: true })
  @Expose()
  muscleTags: (typeof MuscleTags)[number][];
}
