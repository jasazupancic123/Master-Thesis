import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { Workload } from '../entity/workload.entity';

export class CreateUserWorkloadsForComponentDto {
  @ValidateNested({ each: true })
  @Type(() => Workload)
  @Expose()
  @ApiProperty()
  workloads: Workload[];
}
