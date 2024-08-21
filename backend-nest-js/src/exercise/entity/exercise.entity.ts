import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Entity } from '../../common/decorator/entity.decorator';
import { EXERCISE_COLLECTION } from '../../common/const/firestore.const';
import { BaseEntity } from '../../common/entity/base.entity';

@Entity(EXERCISE_COLLECTION)
export class Exercise extends BaseEntity {
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

  attributeValues: Record<string, any>;

  /*@IsEnum(Prescription)
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
  location?: Location;*/
}
