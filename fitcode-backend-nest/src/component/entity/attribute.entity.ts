import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class Attribute {
  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  field: string; // name of the field in the database

  @IsString()
  @ApiProperty()
  @IsNotEmpty()
  @Expose()
  name: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  required?: boolean;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  unit?: string; // kg, lbs, ...

  @ValidateNested({ each: true })
  @Type(() => Attribute)
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  values?: Attribute[]; // possible values for select type
}
