import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

import { BaseEntity } from '@src/common/entity/base.entity';

import { Group } from './group.entity';

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

  @IsNumber()
  @ApiPropertyOptional()
  @Expose()
  @IsOptional()
  exerciseRevisions?: number;

  // virtual, must be populated
  trainerIds: string[];
  athleteIds: string[];
}

export type InitInstitution = Institution & {
  groups: Group[];
};
