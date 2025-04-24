import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { AttributeValue } from '../../attribute/entity/attribute-value.entity';
import { IntersectionType } from '@nestjs/mapped-types';
import { IdEntity } from '../../common/entity/id.entity';

export class ExerciseAttributeValue extends IntersectionType(
  IdEntity,
  AttributeValue,
) {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  exerciseId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  ownerId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  componentIds: string[]; // first component is necessary and cannot be changed, others are for "tags"
}
