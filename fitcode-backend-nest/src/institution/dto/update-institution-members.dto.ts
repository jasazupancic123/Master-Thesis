import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class UpdateInstitutionMembersDto {
  @IsBoolean()
  @ApiProperty()
  @Expose()
  add: boolean; // false - remove members, true - add members

  @IsBoolean()
  @ApiProperty()
  @Expose()
  trainers: boolean; // false - manipulate athletes, true - manipulate trainers

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  memberIds: string[]; // members to add / remove (not the whole new array)
}
