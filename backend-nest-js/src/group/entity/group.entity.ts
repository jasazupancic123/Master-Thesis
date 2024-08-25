import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
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
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  memberIds: string[]; // members of the group

  user: User;
  members: User[];
  subgroups: Group[];
}