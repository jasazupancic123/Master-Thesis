import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class WorkloadStats {
  @IsNumber()
  @ApiProperty()
  @Expose()
  intensity: number;

  @IsNumber()
  @ApiProperty()
  @Expose()
  volume: number;
}
