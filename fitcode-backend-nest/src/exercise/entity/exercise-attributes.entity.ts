import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsString, ValidateNested } from 'class-validator';

import { IsValidSelectPath } from '@src/attribute/decorator/is-valid-select-path.decorator';
import { AttributeValue } from '@src/attribute/entity/attribute-value.entity';

import { BodyRegionValues } from '../enum/body-region.enum';
import { Category } from '../enum/category.enum';
import { Equipment } from '../enum/equipment.enum';
import { LiftPriorityValues } from '../enum/lift-priority.enum';
import { LoadingSideValues } from '../enum/loading-side.enum';
import { LocationValues } from '../enum/location.enum';
import { MovementDirectionValues } from '../enum/movement-direction.enum';
import { PatternValues } from '../enum/patterns.enum';
import { PrescriptionTypeValues } from '../enum/prescription-type.enum';

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

  @IsEnum(PrescriptionTypeValues, { each: true })
  @ApiProperty({ enum: PrescriptionTypeValues, isArray: true })
  @Expose()
  prescriptions: (typeof PrescriptionTypeValues)[number][];

  @IsEnum(PatternValues, { each: true })
  @ApiProperty({ enum: PatternValues, isArray: true })
  @Expose()
  patterns: (typeof PatternValues)[number][];

  @IsEnum(BodyRegionValues, { each: true })
  @ApiProperty({ enum: BodyRegionValues, isArray: true })
  @Expose()
  bodyRegions: (typeof BodyRegionValues)[number][];

  @IsEnum(LoadingSideValues, { each: true })
  @ApiProperty({ enum: LoadingSideValues, isArray: true })
  @Expose()
  loadingSides: (typeof LoadingSideValues)[number][];

  @IsEnum(LocationValues, { each: true })
  @ApiProperty({ enum: LocationValues, isArray: true })
  @Expose()
  locations: (typeof LocationValues)[number][];

  @IsEnum(LiftPriorityValues, { each: true })
  @ApiProperty({ enum: LiftPriorityValues, isArray: true })
  @Expose()
  liftPriorities: (typeof LiftPriorityValues)[number][];

  @IsEnum(MovementDirectionValues, { each: true })
  @ApiProperty({ enum: MovementDirectionValues, isArray: true })
  @Expose()
  movementDirections: (typeof MovementDirectionValues)[number][];
}
