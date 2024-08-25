import { BaseEntity } from '../../common/entity/base.entity';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Entity } from '../../common/decorator/entity.decorator';
import { SET_GROUP_COLLECTION } from '../../common/const/firestore.const';
import { SetSubgroup } from './set-subgroup.entity';

@Entity(SET_GROUP_COLLECTION)
export class SetGroup extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  trainingId: string;

  @IsString()
  @Expose()
  componentId: string;

  @IsNumber()
  @ApiProperty()
  @Expose()
  order: number;

  setSubgroups: SetSubgroup[];
}