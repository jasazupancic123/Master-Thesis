import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Entity } from '../../common/decorator/entity.decorator';
import { BaseEntity } from '../../common/entity/base.entity';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';

@Entity(FirestoreCollection.COMPONENT)
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
  children?: any[]; // if you pass Component type, then Populate interface will recursively call this class
}