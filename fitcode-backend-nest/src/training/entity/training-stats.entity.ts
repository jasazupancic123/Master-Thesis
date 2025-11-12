import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { SetReport } from '../type/training-set.type';

export class PrescribedTrainingComponentStats {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  componentId: string;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  totalSets: number; // for calculating status
}

export class PrescribedTrainingStats extends OmitType(SetReport, [
  'load',
] as const) {
  @Type(() => PrescribedTrainingComponentStats)
  @ValidateNested({ each: true })
  @ApiProperty({ type: () => PrescribedTrainingComponentStats, isArray: true })
  @Expose()
  plannedComponents: PrescribedTrainingComponentStats[];

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  duration: number; // in minutes

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  components: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  supersets: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  exercises: number; // unique

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  sets: number;
}
