import { IdEntity } from 'src/common/entity/id.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ColorEntity } from 'src/common/entity/color.entity';
import { IntersectionType } from '@nestjs/mapped-types';

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
