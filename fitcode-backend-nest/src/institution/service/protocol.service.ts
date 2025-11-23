import { Injectable } from '@nestjs/common';

import {
  InstitutionRef,
  TrainingProtocolRef,
} from '@src/common/type/firestore.type';
import { TrainingProtocol } from '@src/training/entity/training-protocol.entity';

import { Institution } from '../entity/institution.entity';
import { ProtocolRepository } from '../repository/protocol.repository';

@Injectable()
export class ProtocolService {
  constructor(private readonly repository: ProtocolRepository) {}

  async findById(
    institution: Institution,
    protocolId: string,
  ): Promise<TrainingProtocol> {
    const ref: TrainingProtocolRef = {
      institutionId: institution.id,
      protocolId,
    };

    return await this.repository.findById(ref);
  }

  async findAllByInstitution(
    institution: Institution,
  ): Promise<TrainingProtocol[]> {
    return await this.repository.getAllByInstitution({
      institutionId: institution.id,
    });
  }

  async create(institution: Institution, input: TrainingProtocol) {
    const ref: InstitutionRef = { institutionId: institution.id };
    return await this.repository.save({ ...input, ...ref }, ref);
  }

  async update(
    institution: Institution,
    protocolId: string,
    input: Partial<TrainingProtocol>,
  ) {
    const ref: TrainingProtocolRef = {
      institutionId: institution.id,
      protocolId,
    };

    await this.repository.update(ref, input);
  }

  async delete(institution: Institution, protocolId: string) {
    const ref: TrainingProtocolRef = {
      institutionId: institution.id,
      protocolId,
    };

    await this.repository.delete(ref);
  }
}
