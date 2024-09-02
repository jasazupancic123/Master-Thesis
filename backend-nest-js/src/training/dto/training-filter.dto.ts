import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { Filter } from '../../common/type/orm.type';
import { Training } from '../entity/training.entity';

export class TrainingFilterDto implements Filter<Training> {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  cycleId?: string;

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
  startTime?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  @Transform(({ value }) => {
    if (value) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    }
  })
  endTime?: Date;
}

export class AthleteTrainingFilterDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  groupId: string;

  @ApiProperty()
  @Expose()
  @Transform(({ value }) => {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  })
  startTime: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  @Transform(({ value }) => {
    if (value) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    }
  })
  endTime?: Date;
}