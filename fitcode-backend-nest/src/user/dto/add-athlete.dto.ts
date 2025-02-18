import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreateUser } from '../entity/user.entity';

export class AddAthleteDto implements Omit<CreateUser, 'customClaims'> {
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
