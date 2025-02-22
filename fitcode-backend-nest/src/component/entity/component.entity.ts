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

  // virtual fields
  children?: string[];
  parents?: string[];
}
