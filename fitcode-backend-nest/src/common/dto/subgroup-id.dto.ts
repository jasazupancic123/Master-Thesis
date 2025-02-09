import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class SubgroupIdDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  @Expose()
  subgroupId?: string;
}
