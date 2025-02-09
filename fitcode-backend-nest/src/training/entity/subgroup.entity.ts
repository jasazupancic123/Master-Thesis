import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseEntity } from '../../common/entity/base.entity';
import { TrainingComponent } from './training-component.entity';

export class Subgroup extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  membersIds: string[]; // all members of the sub-training (at least 1)

  @IsObject()
  @ApiProperty()
  @Expose()
  components: {
    // separate training plan, initially copied from parent training
    [componentId: string]: TrainingComponent;
  };
}
