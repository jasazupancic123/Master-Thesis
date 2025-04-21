import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AttributeValue } from '../../attribute/entity/attribute-value.entity';
import { IntersectionType } from '@nestjs/mapped-types';
import { IdEntity } from '../../common/entity/id.entity';

export class ExerciseAttributeValue extends IntersectionType(
  AttributeValue,
) {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  id: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiProperty()
  @Expose()
  exerciseId: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Expose()
  @ApiProperty()
  ownerId: string;

  @IsString({ each: true })
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  componentIds: string[]; // first component is necessary and cannot be changed, others are for "tags"
}
