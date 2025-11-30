import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

import { BaseEntity } from '@src/common/entity/base.entity';
import { Institution } from '@src/institution/entity/institution.entity';

import { Cycle } from './cycle.entity';

export class Group extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  institutionId: string; // institution id
  institution?: Institution | null;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  trainerIds: string[]; // all trainers of the group

  @IsString()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 4)
  @ApiProperty({ minLength: 1, maxLength: 4 })
  @Expose()
  shortName: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  membersIds: string[]; // all members of the group

  @ValidateNested({ each: true })
  @Type(() => Cycle)
  @IsOptional()
  @ApiProperty({ type: () => Cycle, isArray: true })
  @Expose()
  cycles: Cycle[]; // array
}
