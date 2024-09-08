import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class IdEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  id: string;
}