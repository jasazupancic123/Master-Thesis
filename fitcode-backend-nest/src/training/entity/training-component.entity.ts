import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsDate, ValidateNested } from 'class-validator';
import { ColorEntity } from 'src/common/entity/color.entity';
import { IdEntity } from 'src/common/entity/id.entity';
import { Subgroup } from './subgroup.entity';
import { Superset } from './superset.entity';

export class TrainingComponent extends IntersectionType(IdEntity, ColorEntity) {
  @IsDate()
  @ApiProperty()
  @Expose()
  @Transform(({ value }) => new Date(value))
  from: Date;

  @IsDate()
  @ApiProperty()
  @Expose()
  @Transform(({ value }) => new Date(value))
  to: Date;

  @ValidateNested({ each: true })
  @Type(() => Superset)
  @ApiProperty()
  @Expose()
  supersets: Superset[];

  @ValidateNested({ each: true })
  @Type(() => Subgroup)
  @ApiProperty()
  @Expose()
  subgroups: Subgroup[];
}
