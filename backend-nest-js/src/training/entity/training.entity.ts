import { BaseEntity } from '../../common/entity/base.entity';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { SetGroup } from '../../set/entity/set-group.entity';
import { Entity } from '../../common/decorator/entity.decorator';
import { TRAINING_COLLECTION } from '../../common/const/firestore.const';

@Entity(TRAINING_COLLECTION)
export class Training extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  cycleId: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  subgroupId?: string; // if null, then it's a training for cycle's group

  @IsDate()
  @ApiProperty()
  @Expose()
  @Transform(({ value }) => new Date(value))
  startTime: Date;

  @IsDate()
  @ApiProperty()
  @Expose()
  @Transform(({ value }) => new Date(value))
  endTime: Date;

  // relations
  setGroups: SetGroup[];
}
