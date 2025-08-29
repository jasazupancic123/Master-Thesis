import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { Attribute } from '@src/attribute/entity/attribute.entity';

export class Param extends Attribute {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @IsNotEmpty()
  @Expose()
  unit?: string; // kg, lbs, ...
}
