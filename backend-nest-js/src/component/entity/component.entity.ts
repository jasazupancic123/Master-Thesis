import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { IdEntity } from '../../common/entity/id.entity';

export class Component extends IdEntity {
  @IsString()
  @ApiProperty()
  @Expose()
  slug: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  parent: string | null; // parent component slug

  @IsString()
  @ApiProperty()
  @Expose()
  name: string;

  children: any[]; // virtual field of children components, cannot be Component[] because of circular dependency of Populate interface
  parents: any[];
}