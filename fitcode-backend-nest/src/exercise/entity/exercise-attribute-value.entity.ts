import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ExerciseAttributeValue {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  attributeId: string;

  @ApiProperty()
  @Expose()
  value: any;
}
