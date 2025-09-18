import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

import { IdEntity } from '@src/common/entity/id.entity';

export class ExerciseMuscleValue extends IdEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  muscleId: string;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  value: number;
}
