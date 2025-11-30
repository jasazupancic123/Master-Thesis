import { Injectable } from '@nestjs/common';
import { addDays, addWeeks, subDays } from 'date-fns';

import { UserRole } from '@src/auth/enum/user-role.enum';
import { TestInstitution, TestUser } from '@src/common/type/entity.type';
import { GroupRef } from '@src/common/type/firestore.type';
import { Group } from '@src/institution/entity/group.entity';
import { generateCycleStub } from '@src/institution/mock/cycle.stub';
import { generateGroupStub } from '@src/institution/mock/group.stub';
import { GroupRepository } from '@src/institution/repository/group.repository';

import { TestRepositoryMixin } from '../test-repository.mixin';

@Injectable()
export class GroupTestRepository extends TestRepositoryMixin<Group, GroupRef>()(
  GroupRepository,
) {
  async createTest(
    institution: TestInstitution,
    input?: {
      manager?: TestUser;
      trainerIds?: string[];
      membersIds?: string[];
      cycleLengthInWeeks?: number;
    },
  ) {
    const {
      trainerIds = institution.members
        .filter((m) => m.role === UserRole.TRAINER)
        .map((t) => t.id),
      membersIds = institution.members
        .filter((m) => m.role === UserRole.ATHLETE)
        .map((t) => t.id),
      cycleLengthInWeeks = 1,
    } = input || {};

    const start = subDays(new Date(), 10);
    let groupId = await this.save(
      generateGroupStub({
        institutionId: institution.id,
        trainerIds,
        membersIds,
        cycles: [
          generateCycleStub({
            from: start,
            to: addWeeks(start, cycleLengthInWeeks),
          }),
          generateCycleStub({
            from: addDays(addWeeks(start, cycleLengthInWeeks), 1),
            to: addDays(addWeeks(start, 2 * cycleLengthInWeeks), 1),
          }),
          generateCycleStub({
            from: addDays(addWeeks(start, 2 * cycleLengthInWeeks), 1),
            to: addDays(addWeeks(start, 3 * cycleLengthInWeeks), 1),
          }),
        ],
      }),
    );

    return await this.findById({ groupId, institutionId: institution.id });
  }
}
