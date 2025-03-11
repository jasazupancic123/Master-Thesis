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
  value: string;

  @IsString()
  @ApiProperty()
  @Expose()
  selected: string; // if type is select, this denotes the selected value, but its type can be number, which is saved in value above
}
