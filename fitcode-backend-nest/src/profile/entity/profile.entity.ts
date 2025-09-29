import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { BaseEntity } from '@src/common/entity/base.entity';

import { Gender } from '../enum/gender.enum';
import { SportLevel } from '../enum/sport-level.enum';

export class Profile extends BaseEntity {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  @Expose()
  customId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  @Expose()
  sport?: string;

  @IsEnum(SportLevel)
  @IsOptional()
  @Expose()
  @ApiProperty({ enum: SportLevel })
  level?: SportLevel;

  @IsEnum(Gender)
  @IsOptional()
  @ApiPropertyOptional({ enum: Gender })
  @Expose()
  gender?: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  @Transform(({ value }) => {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  })
  birthDate?: Date;
}
