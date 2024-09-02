import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CopyTrainingDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  trainingId: string; // id of the training to copy

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  cycleId?: string; // if provided, then the training will be copied to this cycle

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  @Expose()
  subgroupId?: string; // if provided, then the training will be copied to this subgroup
}