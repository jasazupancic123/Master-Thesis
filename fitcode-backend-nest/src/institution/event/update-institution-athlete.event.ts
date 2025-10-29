import { Expose } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { BatchOperation } from '@src/common/type/orm.type';

import { InstitutionMember } from '../entity/institution-member.entity';

export class UpdateInstitutionAthleteEvent {
  @Expose()
  operations: BatchOperation<InstitutionMember | { membersIds: string[] }>[];

  @IsString()
  @IsNotEmpty()
  @Expose()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  institutionId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Expose()
  groupId?: string;

  @IsBoolean()
  @Expose()
  add?: boolean;

  constructor(obj: UpdateInstitutionAthleteEvent) {
    this.operations = obj.operations;
    this.userId = obj.userId;
    this.institutionId = obj.institutionId;
    this.groupId = obj.groupId;
    this.add = obj.add;
  }
}
