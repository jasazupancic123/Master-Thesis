import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { IdEntity } from '@src/common/entity/id.entity';
import { Target } from '@src/target/entity/target.entity';
import { ExerciseMainParamField } from '@src/training/entity/exercise-set.entity';

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

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiPropertyOptional({ type: () => Target, isArray: true })
  @IsOptional()
  @Expose()
  targets: Target[]; // targets which the component supports

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  attributes?: string[];

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  params?: ExerciseMainParamField[]; // exercise params fields

  // virtual fields
  children?: string[];
  parents?: string[];
}
