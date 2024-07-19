import { IsDate, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { PublicUserDto } from '../../user/dto/user.dto';

export class GroupDto {
  @IsString()
  @ApiProperty()
  @Expose()
  id: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  name?: string;

  @IsString()
  @ApiProperty()
  @Expose()
  userId: string; // owner of the group

  @IsDate()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  createdAt: Date;

  @IsString({ each: true })
  @ApiProperty()
  @Expose()
  memberIds: string[]; // members of the group

  @IsString({ each: true })
  @ApiProperty()
  @Expose()
  cycleIds: string[]; // training cycles of the group

  @ValidateNested()
  @IsOptional()
  @Type(() => PublicUserDto)
  @ApiPropertyOptional()
  @Expose()
  user?: PublicUserDto;

  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => PublicUserDto)
  @ApiPropertyOptional()
  @Expose()
  members?: PublicUserDto[];

  /*@ValidateNested({ each: true })
  @IsOptional()
  @Type(() => PublicUserDto)
  @ApiPropertyOptional()
  @Expose()
  cycles: PublicUserDto[];*/
}