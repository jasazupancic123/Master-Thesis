import { IsDate, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { GroupDto } from '../../group/dto/group.dto';
import { TrainingEntity } from '../../training/entity/training.entity';
import { Entity } from '../../common/decorator/entity.decorator';
import { CYCLE_COLLECTION } from '../../common/const/firestore.const';
import { BaseEntity } from '../../common/entity/base.entity';

export interface Week {
  date: Date;
  isTrainingDay: boolean;
  trainings: TrainingEntity[];
}

@Entity(CYCLE_COLLECTION)
export class CycleDto extends BaseEntity {
  @IsString()
  @ApiProperty()
  @Expose()
  groupId: string; // group the cycle belongs to

  @ValidateNested()
  @Type(() => GroupDto)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  group?: GroupDto;

  @IsString()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  description?: string;

  @IsDate()
  @ApiProperty()
  @Expose()
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @IsDate()
  @ApiProperty()
  @Expose()
  @Transform(({ value }) => new Date(value))
  endDate: Date;

  // relations
  trainings?: TrainingEntity[];
  weeks?: Week[][];
}