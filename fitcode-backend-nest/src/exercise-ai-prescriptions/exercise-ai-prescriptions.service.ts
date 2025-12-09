import { Injectable, UnauthorizedException } from '@nestjs/common';

import { LogMethod } from '@src/common/decorator/log-method.decorator';
import { FirebaseUser } from '@src/common/type/firebase-auth.type';
import { FirebaseService } from '@src/firebase/firebase.service';

import { ExerciseAiPrescription } from './entity/exercise-ai-prescriptions';
import { ExerciseAiPrescriptionsRepository } from './repository/exercise-ai-prescriptions.repository';

@Injectable()
export class ExerciseAiPrescriptionsService {
  constructor(
    private readonly repository: ExerciseAiPrescriptionsRepository,
    private readonly firebase: FirebaseService,
  ) {}

  async findAll(): Promise<ExerciseAiPrescription[]> {
    const prescriptionsString = await this.repository.findAll();
    if (!prescriptionsString.length) return [];

    return JSON.parse(
      prescriptionsString[0].prescriptions,
    ) as ExerciseAiPrescription[];
  }

  @LogMethod()
  async upsertMany(
    user: FirebaseUser,
    prescriptions: ExerciseAiPrescription[],
  ): Promise<ExerciseAiPrescription[]> {
    const isAdmin = this.firebase.isAdmin(user);

    if (!isAdmin)
      throw new UnauthorizedException(
        'You are not allowed to update exercise AI prescriptions',
      );

    await this.repository.save({
      prescriptions: JSON.stringify(prescriptions),
    });

    return prescriptions;
  }
}
