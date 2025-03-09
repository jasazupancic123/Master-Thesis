import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { AttributeValue } from '../../attribute/entity/attribute-value.entity';

export class ExerciseAttributeValue extends AttributeValue {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  exerciseId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  ownerId: string;
}
