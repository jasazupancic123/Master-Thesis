import { PickType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { UserWorkload } from '../entity/user-workload.entity';

export class CreateUserWorkloadDto extends PickType(UserWorkload, [
  'data',
] as const) {
  @IsString()
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  exerciseId: string;
}

export class CreateUserWorkloadsForComponentDto {
  @ValidateNested({ each: true })
  @Type(() => CreateUserWorkloadDto)
  @Expose()
  @ApiProperty()
  workloads: CreateUserWorkloadDto[];
}
