import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class ExerciseAttributeValue {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  exerciseId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  ownerId: string | null; // if null, exercise is global

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  field: string;

  @IsString()
  @ApiProperty()
  @Expose()
  value: string | string[];
}
