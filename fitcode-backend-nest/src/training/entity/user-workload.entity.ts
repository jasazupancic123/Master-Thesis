import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Workload } from './workload';

export class UserWorkload {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  userId: string; // document id

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  trainingId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @Expose()
  subgroupId: string;

  @IsObject()
  @ApiProperty()
  @Expose()
  exercises: {
    [exerciseId: string]: Workload;
  };
}
