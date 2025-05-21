import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from '../enum/user-role.enum';

export class RegisterUserDto {
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

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  role: string;
}
