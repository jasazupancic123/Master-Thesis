import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SelectTargetsDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  componentId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  targetId: string;
}
