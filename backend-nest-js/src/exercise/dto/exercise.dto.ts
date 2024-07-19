import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prescription } from '../enum/prescription.enum';
import { Priority } from '../enum/priority.enum';
import { Method } from '../enum/method.enum';
import { LoadingSide } from '../enum/loading-side.enum';
import { BodyRegion } from '../enum/body-region.enum';
import { MovementDirection } from '../enum/movement-direction.enum';
import { Diagnosis } from '../enum/diagnosis.enum';
import { Muscle } from '../enum/muscle.enum';
import { SportTask } from '../enum/sport-task.enum';
import { Location } from '../enum/location.enum';

export class ExerciseDto {
  @IsString()
  @ApiProperty()
  @Expose()
  id: string;

  @IsString()
  @ApiProperty()
  @Expose()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  name: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Expose()
  @ApiProperty()
  componentIds: string[];

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Expose()
  @IsOptional()
  @ApiPropertyOptional()
  components?: string[];

  @IsBoolean()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  global: boolean;

  @IsNumber()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional()
  coefficient1?: number;

  @IsNumber()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional()
  coefficient2?: number;

  @IsNumber()
  @IsOptional()
  @Expose()
  @ApiPropertyOptional()
  coefficient3?: number;

  @IsUrl()
  @IsOptional()
  @IsNotEmpty()
  @Expose()
  @ApiPropertyOptional()
  imageUrl?: string;

  @IsUrl()
  @IsOptional()
  @IsNotEmpty()
  @Expose()
  @ApiPropertyOptional()
  videoUrl?: string;

  @IsEnum(Prescription)
  @IsOptional()
  @Expose()
  @ApiPropertyOptional()
  prescription?: Prescription;

  @IsEnum(Priority)
  @IsOptional()
  @Expose()
  @ApiPropertyOptional()
  priority?: Priority;

  @IsEnum(Method)
  @IsOptional()
  @Expose()
  @ApiPropertyOptional()
  method?: Method;

  @IsEnum(LoadingSide)
  @IsOptional()
  @Expose()
  @ApiPropertyOptional()
  loadingSide?: LoadingSide;

  @IsEnum(BodyRegion)
  @IsOptional()
  @Expose()
  @ApiPropertyOptional()
  bodyRegion?: BodyRegion;

  @IsEnum(MovementDirection)
  @IsOptional()
  @Expose()
  @ApiPropertyOptional()
  movementDirection?: MovementDirection;

  @IsEnum(Diagnosis)
  @IsOptional()
  @Expose()
  @ApiPropertyOptional()
  diagnosis?: Diagnosis;

  @IsEnum(Muscle)
  @IsOptional()
  @Expose()
  @ApiPropertyOptional()
  muscle?: Muscle;

  @IsEnum(SportTask)
  @IsOptional()
  @Expose()
  @ApiPropertyOptional()
  sportTask?: SportTask;

  @IsEnum(Location)
  @IsOptional()
  @Expose()
  @ApiPropertyOptional()
  location?: Location;
}
