import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { IsValidSelectPath } from '@src/common/decorator/is-valid-select-path.decorator';
import { ExerciseParamField } from '@src/training/entity/exercise-set.entity';

import { BodyRegionValues } from '../constant/body-region.constant';
import { Components } from '../constant/components.constant';
import { Equipment } from '../constant/equipment.constant';
import { LiftPriorityValues } from '../constant/lift-priority.constant';
import { LoadingSideValues } from '../constant/loading-side.constant';
import { LocationValues } from '../constant/location.constant';
import { MovementDirectionValues } from '../constant/movement-direction.constant';
import { PatternValues } from '../constant/patterns.constant';
import { PrescriptionTypeValues } from '../constant/prescription-type.constant';
import { ExerciseMuscleValue } from './exercise-muscle-value.entity';

export class ExerciseAttributes {
  @IsBoolean()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional()
  isUnilateral: boolean; // exercise can be performed with both sides of the body separately, like a single arm row

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Expose()
  @ApiProperty()
  params: ExerciseParamField[];

  @IsString({ each: true })
  @ApiProperty()
  @Expose()
  @IsValidSelectPath(Components, { each: true })
  components: string[];

  @IsString({ each: true })
  @ApiProperty()
  @Expose()
  @IsValidSelectPath(Equipment, { each: true })
  equipment: string[];

  @ValidateNested({ each: true })
  @Type(() => ExerciseMuscleValue)
  @ApiProperty({ type: () => ExerciseMuscleValue, isArray: true })
  @Expose()
  muscleValues: ExerciseMuscleValue[];

  @IsIn(PrescriptionTypeValues, { each: true })
  @ApiProperty({ enum: PrescriptionTypeValues, isArray: true })
  @Expose()
  prescriptions: (typeof PrescriptionTypeValues)[number][];

  @IsIn(PatternValues, { each: true })
  @ApiProperty({ enum: PatternValues, isArray: true })
  @Expose()
  patterns: (typeof PatternValues)[number][];

  @IsIn(BodyRegionValues, { each: true })
  @ApiProperty({ enum: BodyRegionValues, isArray: true })
  @Expose()
  bodyRegions: (typeof BodyRegionValues)[number][];

  @IsIn(LoadingSideValues, { each: true })
  @ApiProperty({ enum: LoadingSideValues, isArray: true })
  @Expose()
  loadingSides: (typeof LoadingSideValues)[number][];

  @IsIn(LocationValues, { each: true })
  @ApiProperty({ enum: LocationValues, isArray: true })
  @Expose()
  locations: (typeof LocationValues)[number][];

  @IsIn(LiftPriorityValues, { each: true })
  @ApiProperty({ enum: LiftPriorityValues, isArray: true })
  @Expose()
  liftPriorities: (typeof LiftPriorityValues)[number][];

  @IsIn(MovementDirectionValues, { each: true })
  @ApiProperty({ enum: MovementDirectionValues, isArray: true })
  @Expose()
  movementDirections: (typeof MovementDirectionValues)[number][];
}
