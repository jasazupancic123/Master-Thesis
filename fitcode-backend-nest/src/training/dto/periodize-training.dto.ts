import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PeriodizationType } from 'src/group/enum/periodization-type.enum';

export class PeriodizeTrainingsDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  baseTrainingId: string; // base training to periodize others

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty()
  @Expose()
  excludedTrainingIds: string[]; // IDs of the trainings to exclude by periodization

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

  @ApiProperty({ enum: PeriodizationType, enumName: 'PeriodizationType' })
  @IsNotEmpty()
  @IsEnum(PeriodizationType)
  @Expose()
  periodizationType: PeriodizationType;
}
