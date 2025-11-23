import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { User } from '@src/common/type/firebase-auth.type';
import { TrainingProtocolRef } from '@src/common/type/firestore.type';
import { Components } from '@src/exercise/constant/components.constant';
import { InstitutionService } from '@src/institution/service/institution.service';
import { ProtocolService } from '@src/institution/service/protocol.service';

import { Superset } from '../entity/superset.entity';
import {
  CreateTrainingProtocolDto,
  TrainingProtocol,
} from '../entity/training-protocol.entity';
import { TrainingPlanService } from './training-plan.service';

@Injectable()
export class TrainingProtocolService {
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly protocolService: ProtocolService,
    private readonly trainingPlanService: TrainingPlanService,
  ) {}

  async create(
    user: User,
    institutionId: string,
    input: CreateTrainingProtocolDto,
  ): Promise<TrainingProtocol> {
    const institution = await this.institutionService.findByIdOrFail(
      user,
      institutionId,
    );

    if (!this.institutionService.canEditExtended(user, institution))
      throw new ForbiddenException('You cannot create training protocols');

    const component = Components.find((c) => c.field === input.componentId);
    if (!component) throw new NotFoundException('Component not found');

    const exercises =
      await this.trainingPlanService.getAllTrainingExercisesBySupersets(
        input.supersets,
      );

    const supersets = this.trainingPlanService.validateSupersets(input, {
      exercises,
    });

    const protocolId = await this.protocolService.create(institution, {
      id: null,
      name: input.name,
      componentId: input.componentId,
      description: input.description,
      supersets,
    });

    return {
      id: protocolId,
      institutionId,
      name: input.name,
      componentId: input.componentId,
      description: input.description,
      supersets,
    };
  }

  async update(
    user: User,
    ref: TrainingProtocolRef,
    input: Partial<TrainingProtocol>,
  ) {
    const institution = await this.institutionService.findByIdOrFail(
      user,
      ref.institutionId,
    );

    if (!this.institutionService.canEditExtended(user, institution))
      throw new ForbiddenException('You cannot edit training protocols');

    let supersets: Superset[];
    if (input.supersets) {
      const exercises =
        await this.trainingPlanService.getAllTrainingExercisesBySupersets(
          input.supersets,
        );

      supersets = this.trainingPlanService.validateSupersets(
        { supersets: input.supersets },
        { exercises },
      );
    }

    await this.protocolService.update(institution, ref.protocolId, {
      name: input.name,
      description: input.description,
      supersets,
    });
  }

  async delete(user: User, ref: TrainingProtocolRef) {
    const institution = await this.institutionService.findByIdOrFail(
      user,
      ref.institutionId,
    );

    if (!this.institutionService.canEditExtended(user, institution))
      throw new ForbiddenException('You cannot edit training protocols');

    await this.protocolService.delete(institution, ref.protocolId);
  }
}
