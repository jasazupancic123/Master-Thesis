import { Injectable } from '@nestjs/common';

import { TestInstitution } from '@src/common/type/entity.type';
import { TrainingProtocolRef } from '@src/common/type/firestore.type';
import { ProtocolRepository } from '@src/institution/repository/protocol.repository';
import { TrainingProtocol } from '@src/training/entity/training-protocol.entity';
import { generateTrainingProtocolStub } from '@src/training/mock/training-protocol.stub';

import { TestRepositoryMixin } from '../test-repository.mixin';

@Injectable()
export class ProtocolTestRepository extends TestRepositoryMixin<
  TrainingProtocol,
  TrainingProtocolRef
>()(ProtocolRepository) {
  async createTest(
    institution: TestInstitution,
    data?: Partial<TrainingProtocol>,
  ): Promise<TrainingProtocol> {
    const input = generateTrainingProtocolStub(data);
    const protocolId = await this.save(input, {
      institutionId: institution.id,
    });

    return { ...input, id: protocolId };
  }
}
