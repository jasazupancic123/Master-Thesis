import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CopyComponentDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  copyFromTrainingId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  copyToTrainingId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  componentId: string;

  @IsBoolean()
  @IsOptional()
  @Expose()
  @ApiProperty()
  override?: boolean = false;
}
