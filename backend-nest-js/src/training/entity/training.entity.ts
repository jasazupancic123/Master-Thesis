import { BaseEntity } from '../../common/entity/base.entity';
import { IsDate, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { TrainingComponent } from './training-component.entity';
import { Subgroup } from '../../group/entity/subgroup.entity';
import { Cycle } from '../../group/entity/cycle.entity';

export class Training extends BaseEntity {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  subgroupId?: string | null;
  subgroup: Subgroup | null; // virtual
  /*if null, then it's a training for cycle's group subgroups also have date
  until which they are valid, by default they are valid only one day, so trainer
  can create new subgroups every day, and the next day members of subgroup are
  already available in the parent group*/

  @IsDate()
  @ApiProperty()
  @Expose()
  @Transform(({ value }) => new Date(value))
  from: Date;

  @IsDate()
  @ApiProperty()
  @Expose()
  @Transform(({ value }) => new Date(value))
  to: Date;

  @ValidateNested({ each: true })
  @Type(() => TrainingComponent)
  @ApiProperty()
  @Expose()
  components: TrainingComponent[];

  cycle: Cycle | null; // virtual
}
