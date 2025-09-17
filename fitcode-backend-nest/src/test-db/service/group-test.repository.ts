import { Injectable } from '@nestjs/common';
import { addDays, addWeeks, subDays } from 'date-fns';

import { TestInstitution, TestUser } from '@src/common/type/entity.type';
import { Group } from '@src/group/entity/group.entity';
import { generateCycleStub } from '@src/group/mock/cycle.stub';
import { generateGroupStub } from '@src/group/mock/group.stub';
import { GroupRepository } from '@src/group/repository/group.repository';

import { TestRepositoryMixin } from '../test-repository.mixin';

@Injectable()
export class GroupTestRepository extends TestRepositoryMixin<Group>()(
  GroupRepository,
) {
  async createTest(
    institution: TestInstitution,
    input?: {
      manager?: TestUser;
      trainerId?: string;
      membersIds?: string[];
      cycleLengthInWeeks?: number;
    },
  ) {
    const {
      trainerId = institution.trainerIds[0],
      membersIds = institution.athleteIds,
      cycleLengthInWeeks = 1,
    } = input || {};

    const start = subDays(new Date(), 10);
    let groupId = await this.save(
      generateGroupStub({
        institutionId: institution.id,
        ownerId: trainerId,
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

    return await this.findById(groupId);
  }
}
