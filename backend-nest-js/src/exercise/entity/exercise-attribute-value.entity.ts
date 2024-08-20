import { Entity } from '../../common/decorator/entity.decorator';
import { EXERCISE_ATTRIBUTE_VALUE_COLLECTION } from '../../common/const/firestore.const';
import { BaseEntity } from '../../common/entity/base.entity';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

@Entity(EXERCISE_ATTRIBUTE_VALUE_COLLECTION)
export class ExerciseAttributeValue extends BaseEntity {
  @IsString()
  @ApiProperty()
  @Expose()
  attributeId: string;

  @IsString()
  @ApiProperty()
  @Expose()
  value: string;
}