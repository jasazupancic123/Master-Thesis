import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class ExerciseMuscleValue {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  muscleId: string;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  isometric: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  concentric: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  eccentric: number;
}
