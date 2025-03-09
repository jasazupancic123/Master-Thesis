import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { BaseEntity } from '../../common/entity/base.entity';
import { BodyRegion } from '../enum/body-region';
import { ExerciseAttributeValue } from '../../exercise/entity/exercise-attribute-value.entity';

export class Exercise extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  componentId: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Expose()
  @ApiProperty()
  tags: string[]; // string tags, component tags, ...

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

  // global attributes
  @IsEnum(BodyRegion)
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  region: BodyRegion;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  equipment: string[]; // selected leaf equipment items

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  instruction: string;

  @IsBoolean()
  @ApiProperty()
  @Expose()
  coordination: boolean; // whether exercise can be filtered in "coordination" component

  @ValidateNested({ each: true })
  @Type(() => ExerciseAttributeValue)
  @ApiProperty()
  @Expose()
  attributeValues: ExerciseAttributeValue[]; // sub collection for filtering
}
