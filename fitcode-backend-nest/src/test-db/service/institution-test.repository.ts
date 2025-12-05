import { Injectable } from '@nestjs/common';

import { UserRole } from '@src/auth/enum/user-role.enum';
import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import { TestInstitution, TestUser } from '@src/common/type/entity.type';
import { TestAuth } from '@src/common/utils/test-auth.util';
import { FirebaseService } from '@src/firebase/firebase.service';
import { Institution } from '@src/institution/entity/institution.entity';
import { PartialInstitutionMember } from '@src/institution/entity/institution-member.entity';
import { generateInstitutionStub } from '@src/institution/mock/institution.mock';
import { InstitutionRepository } from '@src/institution/repository/institution.repository';
import { InstitutionMembersRepository } from '@src/institution/repository/institution-members.repository';

import { TestRepositoryMixin } from '../test-repository.mixin';

@Injectable()
export class InstitutionTestRepository extends TestRepositoryMixin<Institution>()(
  InstitutionRepository,
) {
  private readonly auth: TestAuth;

  constructor(
    readonly firebase: FirebaseService,
    readonly institutionMembersRepository: InstitutionMembersRepository,
  ) {
    super(firebase, institutionMembersRepository);
    this.auth = new TestAuth(this.firebase);
  }

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
      input.manager = await this.auth.createManager();

    if (random || input?.createRandomTrainer)
      trainers.push(await this.auth.createTrainer());

    if (random || input?.createRandomAthlete)
      athletes.push(await this.auth.createAthlete());

    const manager = input?.manager || global.manager;
    if (!athletes.length) athletes.push(global.athlete);
    if (!trainers.length) trainers.push(global.trainer);

    const members: PartialInstitutionMember[] = [
      ...trainers.map((t) => ({ id: t.uid, role: UserRole.TRAINER })),
      ...athletes.map((a) => ({ id: a.uid, role: UserRole.ATHLETE })),
    ];

    const institutionId = await this.save(
      generateInstitutionStub({ ownerId: manager.uid }),
    );

    // add members
    await this.firebase.paginateBatches(
      this.institutionMembersRepository.getAddMembersOperation(
        { institutionId },
        members,
      ),
    );

    const data = await this.findById(institutionId);
    return {
      ...data,
      manager,
      trainers,
      athletes,
      members: [
        ...trainers.map((t) => ({ id: t.uid, role: UserRole.TRAINER })),
        ...athletes.map((a) => ({ id: a.uid, role: UserRole.ATHLETE })),
      ],
    };
  }

  async deleteTest(institutionId: string) {
    // remove associated users (but not global ones)
    const institution = await this.findById(institutionId);
    const userIds = [
      ...institution.members.map((m) => m.id),
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

    try {
      await this.auth.deleteUsers(userIds);
      for (const uid of userIds)
        await this.firebase.firestore
          .collection(FirestoreCollection.PROFILE)
          .doc(uid)
          .delete();
    } catch {
    } finally {
      await this.delete(institutionId);
    }
  }
}
