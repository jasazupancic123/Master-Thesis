import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { IdEntity } from '@src/common/entity/id.entity';

export class Target extends IdEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  componentId: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  color?: string;
}
