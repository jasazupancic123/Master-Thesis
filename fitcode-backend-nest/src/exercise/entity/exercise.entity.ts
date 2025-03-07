import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
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
  rootComponentId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  leafComponentIds: string[]; // multiselect

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  ownerId: string | null; // if null, exercise is global

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  attributes: string[]; // all possible "prescribed" attributes

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
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  coordination?: boolean; // whether exercise can be filtered in "coordination" component

  values?: ExerciseAttributeValue[]; // sub collection for filtering
  attributeValues?: Record<string, any>; // for nested object display for frontend
}
