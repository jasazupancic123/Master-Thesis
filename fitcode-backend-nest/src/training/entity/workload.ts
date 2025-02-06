import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';
import { IsStringOrNumber } from 'src/common/decorator/is-string-or-number.decorator';
import { WorkloadType } from '../enum/workload-type.enum';
import { SetData } from './set-data';

export class Workload {
  @IsEnum(WorkloadType)
  @ApiProperty()
  @Expose()
  workloadType: WorkloadType;

  @IsStringOrNumber()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  workloadValue: string | number; // calculated value prescribed by trainer

  // calculated value prescribed by trainer
  @ValidateNested({ each: true })
  @Expose()
  sets: SetData[];
}
