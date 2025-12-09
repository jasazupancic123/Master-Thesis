import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class UserExerciseStats {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  exerciseId: string;

  @IsDate()
  @ApiProperty()
  @Transform(({ value }) => new Date(value))
  @Expose()
  timestamp: Date;

  @ValidateNested()
  @Type(() => UserExerciseRepMax)
  @ApiPropertyOptional({ type: () => UserExerciseRepMax })
  @IsOptional()
  @Expose()
  repMax?: UserExerciseRepMax;
}

export class UserExerciseRepMax {
  @IsInt()
  @Min(0)
  @ApiProperty()
  @Expose()
  reps: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  @Expose()
  loadKg: number;
}
