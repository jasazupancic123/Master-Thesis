import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AttributeValue<T = any> {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  field: keyof T;

  @ApiProperty()
  @Expose()
  value: string | number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  selected?: string; // if type is select/multiselect, this denotes the selected value, but its type can be number, which is saved in value above
}
