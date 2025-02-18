import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { IsStringOrNumber } from 'src/common/decorator/is-string-or-number.decorator';
import { TimestampEntity } from 'src/common/entity/timestamp.entity';
import { WorkloadType } from '../enum/workload-type.enum';
import { SetData } from './set-data';

export class UserWorkload extends TimestampEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  userId: string; // also document id

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  trainingId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  exerciseId: string;

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
