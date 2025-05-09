import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { BaseEntity } from '../../common/entity/base.entity';
import { ExerciseAttributeValue } from '../../exercise/entity/exercise-attribute-value.entity';
import { Attribute } from '../../attribute/entity/attribute.entity';

export class Exercise extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  name: string;

  @IsString({ each: true })
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  componentIds: string[]; // first component is necessary and cannot be changed, others are for "tags"

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  ownerId: string; // special 'global' string value for global exercises

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Expose()
  @ApiPropertyOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Expose()
  @ApiPropertyOptional()
  videoUrl?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  instruction?: string;

  @ValidateNested({ each: true })
  @Type(() => ExerciseAttributeValue)
  @ApiProperty()
  @Expose()
  attributeValues: ExerciseAttributeValue[]; // sub collection for filtering

  @Type(() => Attribute)
  @IsOptional()
  defaultParams?: Attribute[];
}
