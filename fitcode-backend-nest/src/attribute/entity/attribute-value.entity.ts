import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsNotEmpty } from 'class-validator';

export class AttributeValue {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  field: string;

  @IsString()
  @ApiProperty()
  @Expose()
  value: string; // for number, string and single-select types

  @IsString()
  @ApiProperty()
  @Expose()
  selected?: string[]; // for single and multi select types
}
