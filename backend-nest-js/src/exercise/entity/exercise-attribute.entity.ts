import { Entity } from '../../common/decorator/entity.decorator';
import { EXERCISE_ATTRIBUTE_COLLECTION } from '../../common/const/firestore.const';
import { BaseEntity } from '../../common/entity/base.entity';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

@Entity(EXERCISE_ATTRIBUTE_COLLECTION)
export class ExerciseAttribute extends BaseEntity {
  @IsString()
  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  parentId?: string; // id of the parent attribute

  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  name: string; // name of the attribute

  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  field: string; // name of the field in the database

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  required?: boolean; // is attribute required

  @IsString()
  @IsIn(['string', 'number', 'date', 'boolean', 'select'])
  @IsNotEmpty()
  @Expose()
  type: 'string' | 'number' | 'date' | 'boolean' | 'select';

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  description?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  unit?: string; // kg, lbs, ...

  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  values?: string[]; // possible values for select type

  @Type(() => ExerciseAttribute)
  @ValidateNested({ each: true })
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  subattributes?: ExerciseAttribute[]; // subattributes for select type
}