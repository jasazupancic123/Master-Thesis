import { IntersectionType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

import { ColorEntity } from '@src/common/entity/color.entity';
import { IdEntity } from '@src/common/entity/id.entity';

export class Target extends IntersectionType(IdEntity, ColorEntity) {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  componentId: string;
}
