import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { Filter } from '../../common/type/orm.type';
import { Training } from '../entity/training.entity';

export class TrainingFilterDto implements Filter<Training> {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  subgroupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  @Transform(({ value }) => {
    if (value) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    }
  })
  from?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  @Transform(({ value }) => {
    if (value) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    }
  })
  to?: Date;
}