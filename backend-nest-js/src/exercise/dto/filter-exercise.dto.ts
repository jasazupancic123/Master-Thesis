import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { PaginateDto } from '../../common/dto/paginate.dto';
import { Exercise } from '../entity/exercise.entity';
import { Filter } from '../../common/type/orm.type';
import {
  parseQueryArray,
  parseQueryCondition,
} from '../../common/service/util';

export class FilterExerciseDto
  extends PaginateDto<Exercise>
  implements Filter<Exercise>
{
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  @Transform(({ value }) => parseQueryCondition(value))
  global?: Filter<Exercise>['global'];

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  @Transform(({ value }) => parseQueryCondition(value))
  name?: Filter<Exercise>['name'];

  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  @Transform(({ value }) => {
    const result = parseQueryCondition(value);
    return result
      ? { ...result, value: parseQueryArray(result?.value) }
      : undefined;
  })
  componentsIds?: Filter<Exercise>['componentsIds'];

  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  @Transform(({ value }) => parseQueryArray(value))
  ids?: string[];
}
