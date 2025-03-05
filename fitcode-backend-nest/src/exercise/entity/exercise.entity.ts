import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { BaseEntity } from '../../common/entity/base.entity';
import { BodyRegion } from '../enum/body-region';
import { ExerciseAttributeValue } from 'src/exercise/entity/exercise-attribute-value.entity';

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

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  ownerId: string | null; // if null. exercise is global

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

  @IsEnum(BodyRegion)
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  bodyRegion: BodyRegion;

  values?: ExerciseAttributeValue[]; // sub collection for filtering
  attributeValues?: Record<string, any>; // for nested object display for frontend
}
