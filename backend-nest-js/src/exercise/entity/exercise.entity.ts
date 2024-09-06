import { IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entity/base.entity';
import { Component } from '../../component/entity/component.entity';
import { ExerciseAttributeValue } from './exercise-attribute-value.entity';

export class Exercise extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  name: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Expose()
  @ApiProperty()
  componentsIds: string[];
  components: Component[];

  @IsBoolean()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  global: boolean;

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

  @ValidateNested({ each: true })
  @Type(() => ExerciseAttributeValue)
  @ApiProperty()
  @Expose()
  attributes: ExerciseAttributeValue[]; // subcollection where each document has attribute id and value

  attributeValues: Record<string, any>; // for frontend to use
}