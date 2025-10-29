import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean } from 'class-validator';

import { UpdateMemberDto } from '@src/common/dto/user-id.dto';

export class UpdateInstitutionMemberDto extends UpdateMemberDto {
  @IsBoolean()
  @ApiProperty()
  @Expose()
  trainer: boolean; // false - manipulate athletes, true - manipulate trainers
}
