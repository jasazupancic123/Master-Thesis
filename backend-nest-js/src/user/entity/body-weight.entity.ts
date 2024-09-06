import { TimestampEntity } from '../../common/entity/timestamp.entity';
import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class Bodyweight extends TimestampEntity {
  @IsNumber()
  @ApiProperty()
  @Expose()
  weight: number;
}