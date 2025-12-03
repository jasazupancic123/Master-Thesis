import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class UserIdDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  userId: string;
}

export class UserIdsDto {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty({ type: String, isArray: true })
  @Expose()
  userIds: string[];
}

export class OptionalUserIdDto extends PartialType(UserIdDto) {}

export class UpdateMemberDto extends UserIdDto {
  @IsBoolean()
  @ApiProperty()
  @Expose()
  add: boolean; // false - remove members, true - add members
}
