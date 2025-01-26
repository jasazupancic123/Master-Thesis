import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ExerciseAttribute } from './exercise-attribute.entity';

export class ExerciseAttributeValue {
  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  attributeId: string;
  attribute: ExerciseAttribute | null;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  exerciseId: string;

  @ApiProperty()
  @Expose()
  value: any;
}