import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

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
}
