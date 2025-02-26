import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { IsStringOrNumber } from 'src/common/decorator/is-string-or-number.decorator';

export class WorkloadData {
  @IsInt()
  @Min(1)
  @Expose()
  setTypeValue: number; // actual user reps / distance / time / ... completed

  @IsStringOrNumber()
  @IsNotEmpty()
  @Expose()
  @Min(0)
  workloadValue: string | number; // actual user kg completed

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  notes?: string;
}
