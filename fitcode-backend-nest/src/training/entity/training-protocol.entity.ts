import {
  ApiProperty,
  ApiPropertyOptional,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { IdEntity } from '@src/common/entity/id.entity';

import { Superset } from './superset.entity';

export class TrainingProtocol extends IdEntity {
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  institutionId?: string;

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

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  description?: string;

  @ValidateNested({ each: true })
  @Type(() => Superset)
  @ApiProperty({ type: () => Superset, isArray: true })
  @Expose()
  supersets: Superset[]; // actual prescription of the training protocol
}

export class CreateTrainingProtocolDto extends PickType(TrainingProtocol, [
  'name',
  'componentId',
  'description',
  'supersets',
] as const) {}

export class UpdateTrainingProtocolDto extends PartialType(
  CreateTrainingProtocolDto,
) {}
