import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class IdTokenDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  idToken: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  refreshToken: string;
}

export class AuthTokensDto extends IntersectionType(
  IdTokenDto,
  RefreshTokenDto,
) {}
