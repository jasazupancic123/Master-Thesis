import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean } from 'class-validator';

import { UpdateMembersDto } from '@src/common/dto/user-id.dto';

export class UpdateInstitutionMembersDto extends UpdateMembersDto {
  @IsBoolean()
  @ApiProperty()
  @Expose()
  trainer: boolean; // false - manipulate athletes, true - manipulate trainers
}
