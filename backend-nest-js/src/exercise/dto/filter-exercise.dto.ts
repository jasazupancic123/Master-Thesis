import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { PaginateDto } from '../../common/dto/paginate.dto';
import { Exercise } from '../entity/exercise.entity';

export class FilterExerciseDto extends PaginateDto<Exercise> {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  name?: string;

  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  @Transform(({ value }) => value?.split(',') || [])
  componentIds?: string[];

  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  @Transform(({ value }) => value?.split(',') || [])
  ids?: string[];
}