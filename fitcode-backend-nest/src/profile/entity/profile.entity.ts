import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { TimestampEntity } from '@src/common/entity/timestamp.entity';

import { Gender } from '../enum/gender.enum';
import { SportLevel } from '../enum/sport-level.enum';

export class Profile extends TimestampEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  uid: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  email: string;

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
