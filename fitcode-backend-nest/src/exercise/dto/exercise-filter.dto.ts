import { Expose, Transform } from 'class-transformer';
import { BaseFilterDto } from '../../common/dto/filter.dto';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Filter } from '../../common/type/orm.type';
import { Exercise } from '../entity/exercise.entity';
import { BodyRegion } from '../enum/body-region';

export class ExerciseFilterDto
  extends BaseFilterDto
  implements Filter<Exercise>
{
  @IsBoolean()
  @IsOptional()
  @Expose()
  @Transform((params) => {
    if (!params) return undefined;
    const { value } = params;
    return Boolean(value);
  })
  coordination?: boolean;

  @IsString()
  @IsOptional()
  @Expose()
  componentId?: string;

  @IsEnum(BodyRegion)
  @IsOptional()
  @Expose()
  region?: BodyRegion;
}
