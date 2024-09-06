import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ExerciseAttribute {
  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  field: string; // name of the field in the database
  
  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  name: string; // name of the attribute

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

  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  values: (string | ExerciseAttributeSelectOption)[] | null; // possible values for select type
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