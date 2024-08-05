import { BaseEntity } from '../../common/entity/base.entity';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CycleDto } from '../../cycle/dto/cycle.dto';
import { Expose, Transform } from 'class-transformer';
import { ComponentDto } from '../../component/dto/component.dto';
import { SetGroupEntity } from './set-group.entity';
import { Entity } from '../../common/decorator/entity.decorator';
import { TRAINING_COLLECTION } from '../../common/const/firestore.const';

@Entity(TRAINING_COLLECTION)
export class TrainingEntity extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  cycleId: string;

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
  cycle?: CycleDto;
  setGroups?: SetGroupEntity[];
  components?: ComponentDto[];
}

export type TrainingRelations = Pick<TrainingEntity, 'cycle' | 'setGroups' | 'components'>;