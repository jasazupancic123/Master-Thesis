import { Injectable } from '@nestjs/common';

import { TestInstitution, TestUser } from '@src/common/type/entity.type';
import {
  createAthleteUserAndToken,
  createManagerUserAndToken,
  createTrainerUserAndToken,
} from '@src/common/utils/auth.util';
import { deleteUsersByIds } from '@src/common/utils/data.util';
import { Institution } from '@src/institution/entity/institution.entity';
import { generateInstitutionStub } from '@src/institution/mock/institution.mock';
import { InstitutionRepository } from '@src/institution/repository/institution.repository';

import { TestRepositoryMixin } from '../test-repository.mixin';

@Injectable()
export class InstitutionTestRepository extends TestRepositoryMixin<Institution>()(
  InstitutionRepository,
) {
  /**
   * Creates a test institution with associated users.
   */
  async createTest(input?: {
    manager?: TestUser;
    athletes?: TestUser[]; // additional athletes
    trainers?: TestUser[]; // additional trainers
    random?: boolean; // if true, creates one random manager, athlete, and trainer
    createRandomManager?: boolean;
    createRandomAthlete?: boolean;
    createRandomTrainer?: boolean;
  }): Promise<TestInstitution> {
    const athletes: TestUser[] = [];
    const trainers: TestUser[] = [];

    if (input?.athletes) athletes.push(...input.athletes);
    if (input?.trainers) trainers.push(...input.trainers);

    const { random = false } = input || {};
    if (random || input?.createRandomManager)
      input.manager = await createManagerUserAndToken(this.firebaseService);

    if (random || input?.createRandomTrainer)
      trainers.push(await createTrainerUserAndToken(this.firebaseService));

    if (random || input?.createRandomAthlete)
      athletes.push(await createAthleteUserAndToken(this.firebaseService));

    const manager = input?.manager || global.manager;
    if (!athletes.length) athletes.push(global.athlete);
    if (!trainers.length) trainers.push(global.trainer);

    const institutionId = await this.save(
      generateInstitutionStub({
        ownerId: manager.uid,
        athleteIds: athletes.map((a) => a.uid),
        trainerIds: trainers.map((t) => t.uid),
      }),
    );

    const data = await this.findById(institutionId);
    return { ...data, manager, trainers, athletes };
  }

  async remove(institutionId: string) {
    // remove associated users (but not global ones)
    const institution = await this.findById(institutionId);
    const userIds = [
      ...institution.athleteIds,
      ...institution.trainerIds,
      institution.ownerId,
    ].filter(
      (uid) =>
        ![
          global.athlete.uid,
          global.trainer.uid,
          global.manager.uid,
          global.admin.uid,
        ].includes(uid),
    );

    await deleteUsersByIds(this.firebaseService, userIds);
    await this.delete(institutionId);
  }
}
