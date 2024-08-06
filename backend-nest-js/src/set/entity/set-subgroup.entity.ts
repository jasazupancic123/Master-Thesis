import { BaseEntity } from '../../common/entity/base.entity';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Entity } from '../../common/decorator/entity.decorator';
import { SET_SUB_GROUP_COLLECTION } from '../../common/const/firestore.const';
import { SetExerciseEntity } from './set-exercise.entity';

@Entity(SET_SUB_GROUP_COLLECTION)
export class SetSubgroupEntity extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  setGroupId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  color: string;

  @IsInt()
  @Min(0)
  @ApiProperty()
  @Expose()
  order: number;

  // relations
  setExercises: SetExerciseEntity[];
}