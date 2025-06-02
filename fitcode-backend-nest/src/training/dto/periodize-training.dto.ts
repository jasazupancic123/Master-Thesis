import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { PeriodizationType } from 'src/group/enum/periodization-type.enum';
import { Training } from '../entity/training.entity';

export class PeriodizeTrainingsDto {
  @ValidateNested()
  @Type(() => Training)
  @ApiProperty()
  @Expose()
  baseTraining: Training; // base training to periodize others

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  trainingIds: string[]; // IDs of the trainings to periodize

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  componentId: string; // ID of the component to periodize

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  exerciseIds: string[]; // IDs of the exercises to periodize

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  periodizationType: string; // Type of periodization to apply
}
