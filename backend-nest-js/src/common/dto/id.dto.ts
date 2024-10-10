import { PickType } from '@nestjs/mapped-types';
import { BaseEntity } from '../entity/base.entity';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class IdDto extends PickType(BaseEntity, ['id'] as const) {}

export class IdsDto {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty({ type: [String] })
  @Expose()
  ids: string[];
}
