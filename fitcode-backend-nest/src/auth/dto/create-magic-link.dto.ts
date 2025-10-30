import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

import { UserIdDto } from '@src/common/dto/user-id.dto';

export class CreateMagicLinkDto extends UserIdDto {}

export class VerifyMagicLinkDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  token: string;
}
