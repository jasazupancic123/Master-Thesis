import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { IsDate, ValidateNested } from 'class-validator';
import { ColorEntity } from '../../common/entity/color.entity';
import { IdEntity } from '../../common/entity/id.entity';
import { Subgroup } from './subgroup.entity';
import { Superset } from './superset.entity';
import { CopiedFrom } from './copied-from.entity';

export class TrainingComponent extends IntersectionType(IdEntity, ColorEntity) {
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
  @Type(() => Superset)
  @ApiProperty()
  @Expose()
  supersets: Superset[];

  @ValidateNested({ each: true })
  @Type(() => Subgroup)
  @ApiProperty()
  @Expose()
  subgroups: Subgroup[];

  @IsString({ each: true })
  @ApiProperty()
  @Expose()
  completedMembersIds: string[]; // members who completed the training

  @Type(() => CopiedFrom)
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  copiedFrom?: CopiedFrom; // used for copying components from other trainings
}
