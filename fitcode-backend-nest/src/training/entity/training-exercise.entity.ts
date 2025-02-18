import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { IdEntity } from 'src/common/entity/id.entity';
import { ExerciseMeta } from './exercise-meta.entity';

export class TrainingExercise extends IdEntity {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  color?: string;

  @ValidateNested()
  @Type(() => ExerciseMeta)
  @ApiProperty()
  @Expose()
  meta: ExerciseMeta;
}
