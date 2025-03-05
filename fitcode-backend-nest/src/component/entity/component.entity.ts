import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { IdEntity } from '../../common/entity/id.entity';
import { Attribute } from './attribute.entity';

type AttributeType = 'string' | 'boolean' | 'number' | 'select' | 'multiselect';

export class Component extends IdEntity {
  @IsString()
  @ApiProperty()
  @Expose()
  slug: string;

  @IsString()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  parentId: string | null; // parent component slug

  @ValidateNested({ each: true })
  @Type(() => Attribute)
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  setTypeParams?: Attribute[];

  @ValidateNested({ each: true })
  @Type(() => Attribute)
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  workloadTypeParams?: Attribute[];

  attributes?: (Attribute & AttributeType)[];
  params?: (Attribute & AttributeType)[];

  // virtual fields
  children?: string[];
  parents?: string[];
}
