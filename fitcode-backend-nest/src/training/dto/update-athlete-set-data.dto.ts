import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { UserWorkload } from '../entity/user-workload.entity';

export class CreateUserWorkloadsForComponentDto {
  @ValidateNested({ each: true })
  @Type(() => UserWorkload)
  @Expose()
  @ApiProperty()
  workloads: UserWorkload[];
}
