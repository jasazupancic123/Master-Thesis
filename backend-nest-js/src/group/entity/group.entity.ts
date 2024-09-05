import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { Entity } from '../../common/decorator/entity.decorator';
import { User } from '../../common/type/firebase-auth.type';
import { BaseEntity } from '../../common/entity/base.entity';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import { Subgroup } from './subgroup.entity';
import { Cycle } from './cycle.entity';

@Entity(FirestoreCollection.GROUP)
export class Group extends BaseEntity {
  @IsString()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString()
  @ApiProperty()
  @Expose()
  ownerId: string; // owner of the group

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  membersIds: string[]; // all members of the group

  @ValidateNested({ each: true })
  @Type(() => Subgroup)
  @IsOptional()
  @ApiProperty()
  @Expose()
  subgroups: Subgroup[];

  @ValidateNested({ each: true })
  @Type(() => Cycle)
  @IsOptional()
  @ApiProperty()
  @Expose()
  cycles: Cycle[];

  user: User;
  members: User[];
}