import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { UserRole } from '../enum/user-role.enum';

export class FilterUserQueryDto {
  @IsOptional()
  @IsString({ each: true })
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  ids?: string[];

  @IsOptional()
  @IsString({ each: true })
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  emails?: string[];

  @IsEnum(UserRole)
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  role?: UserRole;
}
