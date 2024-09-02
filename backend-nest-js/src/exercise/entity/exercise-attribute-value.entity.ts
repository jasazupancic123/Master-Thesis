import { Entity } from '../../common/decorator/entity.decorator';
import { BaseEntity } from '../../common/entity/base.entity';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ExerciseAttribute } from './exercise-attribute.entity';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';

@Entity(FirestoreCollection.EXERCISE_ATTRIBUTE_VALUE)
export class ExerciseAttributeValue extends BaseEntity {
  @IsString()
  @ApiProperty()
  @Expose()
  attributeId: string;

  @IsString()
  @ApiProperty()
  @Expose()
  exerciseId: string;

  @ApiProperty()
  @Expose()
  value: any;

  attribute?: ExerciseAttribute;
}