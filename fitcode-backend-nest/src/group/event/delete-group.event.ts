import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { BatchOperation } from '@src/common/type/firestore.type';

import { Group } from '../entity/group.entity';

export class DeleteGroupOrCycleEvent {
  @Expose()
  operations: BatchOperation<Group>[];

  @Expose()
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @Expose()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  cycleId?: string;

  constructor(obj: DeleteGroupOrCycleEvent) {
    this.operations = obj.operations;
    this.groupId = obj.groupId;
    this.cycleId = obj.cycleId;
  }
}
