import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { BaseEntity } from '@src/common/entity/base.entity';

export class Institution extends BaseEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  ownerId: string; // added by admin

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  imageUrl?: string;

  // virtual, must be populated
  trainerIds: string[];
  athleteIds: string[];
}
