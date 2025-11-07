import { Injectable } from '@nestjs/common';

import { getTime } from '@src/common/utils/date.util';
import { Group } from '@src/group/entity/group.entity';
import { Training } from '@src/training/entity/training.entity';
import { generateTrainingStub } from '@src/training/mock/training.stub';
import { TrainingRepository } from '@src/training/repository/training.repository';

import { TestRepositoryMixin } from '../test-repository.mixin';

@Injectable()
export class TrainingTestRepository extends TestRepositoryMixin<Training>()(
  TrainingRepository,
) {
  async createTest(group: Group, input?: Partial<Training>): Promise<Training> {
    const id = await this.save(
      generateTrainingStub({
        institutionId: group.institutionId,
        groupId: group.id,
        cycleId: input?.cycleId || group.cycles[0].id,
        ownerId: group.ownerId,
        membersIds: group.membersIds,
        from: input?.from || getTime(new Date(), 8, 0),
        to: input?.to || getTime(new Date(), 9, 0),
        ...input,
      }),
    );

    return await this.findById(id);
  }
}
