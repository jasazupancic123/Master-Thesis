import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
} from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { ColorEntity } from '@src/common/entity/color.entity';
import { IdEntity } from '@src/common/entity/id.entity';
import { Target } from '@src/target/entity/target.entity';

import { MainSet } from '../enum/main-set.enum';
import { CopiedFrom } from './copied-from.entity';
import { Subgroup } from './subgroup.entity';
import { Superset } from './superset.entity';

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

  @IsEnum(MainSet)
  @IsString()
  @ApiProperty({
    enum: MainSet,
    enumName: 'MainSet',
    description: 'Type of main set',
  })
  @Expose()
  mainSet: MainSet; // defaults to "block"

  @Type(() => Target)
  @ValidateNested()
  @ApiPropertyOptional({ type: () => Target })
  @IsOptional()
  @Expose()
  target?: Target; // selected target id which the component uses

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  methodId?: string; // method id which the component uses

  @ValidateNested({ each: true })
  @Type(() => Superset)
  @ApiProperty({ type: () => Superset, isArray: true })
  @Expose()
  supersets: Superset[];

  @ValidateNested({ each: true })
  @Type(() => Subgroup)
  @ApiProperty({ type: () => Subgroup, isArray: true })
  @Expose()
  subgroups: Subgroup[];

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  completedMembersIds: string[]; // members who completed the training

  @Type(() => CopiedFrom)
  @IsOptional()
  @ApiPropertyOptional({ type: () => CopiedFrom })
  @Expose()
  copiedFrom?: CopiedFrom; // used for copying components from other trainings
}

export type TrainingComponentWithoutTime = Omit<
  TrainingComponent,
  'from' | 'to'
>;
