import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Entity } from '../../common/decorator/entity.decorator';
import { COMPONENT_COLLECTION } from '../../common/const/firestore.const';

@Entity(COMPONENT_COLLECTION)
export class ComponentDto {
  @IsString()
  @ApiProperty()
  @Expose()
  id: string;

  @IsString()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  parentId?: string;

  @ValidateNested({ each: true })
  @Type(() => ComponentDto)
  @IsOptional()
  @ApiPropertyOptional({ type: ComponentDto, isArray: true })
  @Expose()
  children?: ComponentDto[];
}