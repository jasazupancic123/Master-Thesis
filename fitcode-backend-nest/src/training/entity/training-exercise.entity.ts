import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, ValidateNested } from 'class-validator';
import { ColorEntity } from '../../common/entity/color.entity';
import { IdEntity } from '../../common/entity/id.entity';
import { Attribute } from '../../attribute/entity/attribute.entity';
import { ExerciseSet } from './exercise-set.entity';
import { AttributeRange } from '../../attribute/entity/attribute-range.entity';

export class TrainingExercise extends IntersectionType(IdEntity, ColorEntity) {
  @ValidateNested({ each: true })
  @Type(() => Attribute)
  @ApiProperty()
  @Expose()
  params: Attribute[];

  @ValidateNested({ each: true })
  @Type(() => ExerciseSet)
  @ApiProperty()
  @Expose()
  sets: ExerciseSet[];

  @IsBoolean()
  @ApiProperty()
  @Expose()
  periodized: boolean;

  @ValidateNested({ each: true })
  @Type(() => AttributeRange)
  @ApiProperty()
  @Expose()
  attributeRanges: AttributeRange[];
}
