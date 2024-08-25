import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Entity } from '../../common/decorator/entity.decorator';
import { COMPONENT_COLLECTION } from '../../common/const/firestore.const';
import { BaseEntity } from '../../common/entity/base.entity';

@Entity(COMPONENT_COLLECTION)
export class Component extends BaseEntity {
  @IsString()
  @ApiProperty()
  @Expose()
  id: string;

  @IsString()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString()
  @ApiProperty()
  @Expose()
  slug: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  parentId?: string;

  @ValidateNested({ each: true })
  @Type(() => Component)
  @IsOptional()
  @ApiPropertyOptional({ type: Component, isArray: true })
  @Expose()
  children?: Component[];
}