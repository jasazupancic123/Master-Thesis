import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TimestampEntity } from '../../common/entity/timestamp.entity';
import { SetStatus } from '../enum/set-status.enum';

export class TrainingStatus extends TimestampEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  trainingId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  componentId: string;

  @IsEnum(SetStatus)
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  status: SetStatus;
}
