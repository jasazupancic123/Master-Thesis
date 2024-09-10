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
  name?: Filter<Exercise>['name'];

  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  @Transform(({ value }) => {
    const result = parseQueryCondition(value);
    const val = parseQueryArray(result.value);
    return { ...result, value: val };
  })
  componentsIds?: Filter<Exercise>['componentsIds'];

  @IsString({ each: true })
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  @Transform(({ value }) => parseQueryArray(value))
  ids?: string[];
}
