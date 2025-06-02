import { IdEntity } from 'src/common/entity/id.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class Method extends IdEntity {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  targetId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  ability: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  repetition: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  intensity: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @Expose()
  recovery: string;

  @IsString()
  @ApiProperty()
  @Expose()
  @IsOptional()
  set: string;

  @IsString()
  @ApiProperty()
  @Expose()
  @IsOptional()
  tempo: string;
}
