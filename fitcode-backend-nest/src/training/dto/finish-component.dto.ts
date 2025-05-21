import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Superset } from '../entity/superset.entity';
import { Type, Expose } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class FinishComponentDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  rootComponentId: string;

  @ValidateNested({ each: true })
  @Type(() => Superset)
  @Expose()
  @ApiProperty()
  supersets: Superset[];
}
