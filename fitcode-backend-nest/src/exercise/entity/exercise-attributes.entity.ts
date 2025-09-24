import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsString } from 'class-validator';

import { IsValidSelectPath } from '@src/attribute/decorator/is-valid-select-path.decorator';

import { BodyRegion } from '../enum/body-region.enum';
import { Equipment } from '../enum/equipment.enum';
import { LiftPriority } from '../enum/lift-priority.enum';
import { LoadingSide } from '../enum/loading-side.enum';
import { Location } from '../enum/location.enum';
import { MovementDirection } from '../enum/movement-direction.enum';
import { Patterns } from '../enum/patterns.enum';
import { PrescriptionType } from '../enum/prescription-type.enum';

export class ExerciseAttributes {
  @IsEnum(PrescriptionType, { each: true })
  @ApiProperty({ enum: PrescriptionType, isArray: true })
  @Expose()
  prescriptions: PrescriptionType[];

  @IsEnum(Patterns, { each: true })
  @ApiProperty({ enum: Patterns, isArray: true })
  @Expose()
  patterns: (typeof Patterns)[number][];

  @IsEnum(BodyRegion, { each: true })
  @ApiProperty({ enum: BodyRegion, isArray: true })
  @Expose()
  bodyRegions: BodyRegion[];

  @IsString({ each: true })
  @ApiProperty()
  @Expose()
  @IsValidSelectPath(Equipment, { each: true })
  equipment: (typeof Equipment)[number][];

  @IsEnum(LoadingSide, { each: true })
  @ApiProperty({ enum: LoadingSide, isArray: true })
  @Expose()
  loadingSides: LoadingSide[];

  @IsEnum(Location, { each: true })
  @ApiProperty({ enum: Location, isArray: true })
  @Expose()
  locations: Location[];

  @IsEnum(LiftPriority, { each: true })
  @ApiProperty({ enum: LiftPriority, isArray: true })
  @Expose()
  liftPriorities: LiftPriority[];

  @IsEnum(MovementDirection, { each: true })
  @ApiProperty({ enum: MovementDirection, isArray: true })
  @Expose()
  movementDirections: MovementDirection[];
}
