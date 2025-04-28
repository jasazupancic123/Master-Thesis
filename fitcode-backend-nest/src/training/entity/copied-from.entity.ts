import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CopiedFrom {
  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  rootCopiedFromTrainingId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  lastCopiedFromTrainingId: string;
}
