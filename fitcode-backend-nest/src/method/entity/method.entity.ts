import { IdEntity } from '../../common/entity/id.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Attribute } from '../../attribute/entity/attribute.entity';

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
