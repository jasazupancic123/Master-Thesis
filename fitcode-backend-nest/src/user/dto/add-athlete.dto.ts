import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddAthleteDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  displayName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  password: string;
}
