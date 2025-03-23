import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsInt, Max, Min, ValidateNested } from 'class-validator';
import { AttributeValue } from './attribute-value.entity';

export class ExerciseSet {
  @IsInt()
  @Min(1)
  @Max(20)
  @ApiProperty()
  @Expose()
  setNumber: number;

  @ValidateNested({ each: true })
  @Type(() => AttributeValue)
  @ApiProperty()
  @Expose()
  paramValues: AttributeValue[];
}
