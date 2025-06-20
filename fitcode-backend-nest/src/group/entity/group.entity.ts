import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { BaseEntity } from '../../common/entity/base.entity';
import { Cycle } from './cycle.entity';

export class Group extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  institutionId: string; // institution id

  @IsString()
  @ApiProperty()
  @Expose()
  ownerId: string; // owner of the group (trainer, added by manager)

  @IsString()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  membersIds: string[]; // all members of the group

  @ValidateNested({ each: true })
  @Type(() => Cycle)
  @IsOptional()
  @ApiProperty()
  @Expose()
  cycles: Cycle[]; // array
}
