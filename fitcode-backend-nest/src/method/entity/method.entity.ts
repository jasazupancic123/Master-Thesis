import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Attribute } from '@src/attribute/entity/attribute.entity';
import { IdEntity } from '@src/common/entity/id.entity';

export class Method extends IdEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  targetId: string;

  @ValidateNested({ each: true })
  @Type(() => Attribute)
  @ApiProperty()
  @Expose()
  attributes: Attribute[];

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  ability: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  intensity: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  recovery: string;

  @IsString()
  @ApiProperty()
  @Expose()
  @IsOptional()
  tempo: string;

  @IsString()
  @ApiProperty()
  @Expose()
  @IsOptional()
  repetition: string;

  @IsString()
  @ApiProperty()
  @Expose()
  @IsOptional()
  set: string;
}
