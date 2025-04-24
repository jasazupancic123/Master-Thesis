import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

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
}
