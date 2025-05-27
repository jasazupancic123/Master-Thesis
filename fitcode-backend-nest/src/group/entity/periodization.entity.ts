import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested, IsString, IsNotEmpty } from 'class-validator';
import { PeriodizationType } from '../enum/periodization-type.enum';

export class Periodization {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  type: PeriodizationType;

  @ValidateNested({ each: true })
  @Type(() => PeriodizationComponentTrainingIds)
  @ApiProperty()
  @Expose()
  basePeriodizationTrainingIds: PeriodizationComponentTrainingIds[];
}

export class PeriodizationComponentTrainingIds {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  componentId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  trainingId: string;
}
