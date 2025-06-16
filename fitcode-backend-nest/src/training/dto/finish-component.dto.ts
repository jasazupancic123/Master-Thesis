import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PickType } from '@nestjs/mapped-types';
import { TrainingComponent } from '../entity/training-component.entity';

export class FinishComponentDto extends PickType(TrainingComponent, [
  'supersets',
] as const) {
  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  rootComponentId: string;
}
