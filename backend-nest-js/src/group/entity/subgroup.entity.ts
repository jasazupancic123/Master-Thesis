import { IsDate, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { BaseEntity } from '../../common/entity/base.entity';
import { User } from '../../common/type/custom-claims.type';

export class Subgroup extends BaseEntity {
  @IsString()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString()
  @ApiProperty()
  @Expose()
  cycleId: string; // cycle to which the subgroup belongs to

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  membersIds: string[]; // all members of the subgroup

  @IsDate()
  @ApiProperty()
  @Transform(({ value }) => new Date(value))
  @Expose()
  from: Date; // valid from

  @IsDate()
  @ApiProperty()
  @Transform(({ value }) => new Date(value))
  @Expose()
  to: Date; // valid to

  members: User[];
}