import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsIn, IsString, ValidateNested } from 'class-validator';

import { IsValidSelectPath } from '@src/attribute/decorator/is-valid-select-path.decorator';
import { AttributeValue } from '@src/attribute/entity/attribute-value.entity';

import { BodyRegionValues } from '../constant/body-region.constant';
import { Category } from '../constant/category.constant';
import { Equipment } from '../constant/equipment.constant';
import { LiftPriorityValues } from '../constant/lift-priority.constant';
import { LoadingSideValues } from '../constant/loading-side.constant';
import { LocationValues } from '../constant/location.constant';
import { MovementDirectionValues } from '../constant/movement-direction.constant';
import { PatternValues } from '../constant/patterns.constant';
import { PrescriptionTypeValues } from '../constant/prescription-type.constant';

export class ExerciseAttributes {
  @IsString({ each: true })
  @ApiProperty()
  @Expose()
  @IsValidSelectPath(Category, { each: true })
  categories: string[];

  @IsString({ each: true })
  @ApiProperty()
  @Expose()
  @IsValidSelectPath(Equipment, { each: true })
  equipment: string[];

  @ValidateNested({ each: true })
  @Type(() => AttributeValue)
  @ApiProperty({ type: () => AttributeValue, isArray: true })
  @Expose()
  muscleValues: AttributeValue[];

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
