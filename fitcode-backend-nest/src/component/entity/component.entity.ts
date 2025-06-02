import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IdEntity } from '../../common/entity/id.entity';
import { ComponentParam } from './component-param.entity';
import { Target } from 'src/target/entity/target.entity';

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

  @IsString({each: true})
  @IsNotEmpty({ each: true })
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  targets: Target[]; // targets which the component supports

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  attributes?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  params?: { [condition: string]: ComponentParam[] }; // only root components have params

  // virtual fields
  children?: string[];
  parents?: string[];
}
