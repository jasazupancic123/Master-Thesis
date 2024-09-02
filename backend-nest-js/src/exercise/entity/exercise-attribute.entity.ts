import { Entity } from '../../common/decorator/entity.decorator';
import { BaseEntity } from '../../common/entity/base.entity';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';

@Entity(FirestoreCollection.EXERCISE_ATTRIBUTE)
export class ExerciseAttribute extends BaseEntity {
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
  unit?: string; // kg, lbs, ...

  @ApiProperty()
  @Expose()
  values: (string | ExerciseAttributeSelectOption)[]; // possible values for select type
}

export class ExerciseAttributeSelectOption {
  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  name: string;

  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  field: string;

  @ApiProperty()
  @Expose()
  values: (string | ExerciseAttributeSelectOption)[];
}