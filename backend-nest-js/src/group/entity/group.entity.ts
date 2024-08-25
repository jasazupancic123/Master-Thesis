import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { Entity } from '../../common/decorator/entity.decorator';
import { GROUP_COLLECTION } from '../../common/const/firestore.const';
import { User } from '../../common/type/custom-claims.type';
import { BaseEntity } from '../../common/entity/base.entity';

@Entity(GROUP_COLLECTION)
export class Group extends BaseEntity {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  parentId: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  name?: string;

  @IsString()
  @ApiProperty()
  @Expose()
  userId: string; // owner of the group

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  memberIds: string[]; // members of the group

  @IsDate()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  @Transform(({ value }) => value ? new Date(value) : null)
  validUntil?: Date; // for subgroups

  @IsDate()
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  lastModifiedAvailableMembers: Date; // last time available members were updated

  user: User;
  members: User[];
  subgroups: Group[];
}