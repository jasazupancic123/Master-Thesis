import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CommonService } from 'src/common/service/common.service';
import { ExerciseService } from 'src/exercise/service/exercise.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { TrainingRepository } from '../repository/training.repository';
import { UserWorkloadService } from './user-workload.service';
import { Wrapper } from 'src/common/type/wrapper.type';
import { UserService } from 'src/user/service/user.service';
import { CreateSubgroup, UpdateSubgroup } from '../type/subgroup.type';
import {
  SubgroupRef,
  TrainingRef,
} from 'src/common/type/firebase-firestore.type';
import { v4 } from 'uuid';
import { FieldValue, Timestamp, Transaction } from 'firebase-admin/firestore';
import { Training } from '../entity/training.entity';

/**
 * NOTE - this is a "private" service, meaning there are no
 * controller methods here, and there are no user checks or
 * other checks you would expect
 */
@Injectable()
export class SubgroupService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly commonService: CommonService,
    private readonly trainingRepository: TrainingRepository,
    private readonly exerciseService: ExerciseService,
    private readonly trainingWorkloadService: UserWorkloadService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: Wrapper<UserService>,
  ) {}

  findById(id: string, training: Training) {
    if (!(id in training.subgroups)) return null;
    return training.subgroups[id];
  }

  findByIdOrFail(id: string, training: Training) {
    const item = this.findById(id, training);
    if (!item) throw new BadRequestException('Subgroup does not exist');
    return item;
  }

  async create(ref: TrainingRef, input: CreateSubgroup): Promise<string> {
    const subgroupId = v4();

    await this.trainingRepository.doc(ref.trainingId).update({
      subgroups: FieldValue.arrayUnion({
        id: subgroupId,
        ...input,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }),
    });

    return subgroupId;
  }

  async update(ref: SubgroupRef, input: UpdateSubgroup): Promise<void> {
    const docRef = this.trainingRepository.doc(ref.trainingId);

    try {
      await this.firebaseService.firestore.runTransaction(
        async (transaction) => {
          const doc = await transaction.get(docRef);
          const training = doc.data() as Training;
          const subgroup = this.findByIdOrFail(ref.subgroupId, training);

          // update subgroup
          const subgroups = training.subgroups;
          subgroups[ref.subgroupId] = { ...subgroup, ...input };
          transaction.update(docRef, { updatedAt: Timestamp.now(), subgroups });
        },
      );
    } catch (e) {
      console.error('updateSubgroup transaction failed:', e);
    }
  }

  async delete(ref: SubgroupRef) {
    const docRef = this.trainingRepository.doc(ref.trainingId);

    try {
      await this.firebaseService.firestore.runTransaction(
        async (transaction) => {
          const doc = await transaction.get(docRef);
          const training = doc.data() as Training;
          this.findByIdOrFail(ref.subgroupId, training);

          // remove subgroup
          const { [ref.subgroupId]: _, ...updatedSubgroups } =
            training.subgroups;
          training.subgroups = updatedSubgroups;

          transaction.update(docRef, {
            updatedAt: Timestamp.now(),
            subgroups: training.subgroups,
          });
        },
      );
    } catch (e) {
      console.error('deleteSubgroup transaction failed:', e);
    }
  }

  updateMembersByTraining(
    transaction: Transaction,
    training: Training,
    membersIds: string[],
  ) {
    const trainingRef = this.trainingRepository.doc(training.id);

    // `removed` indicates members that were removed from parent training
    const removed = training.membersIds.filter(
      (id) => !membersIds.includes(id),
    );

    // remove all removed members from parent training from all subgroups
    const subgroups = training.subgroups || {};
    for (const subgroupId in subgroups) {
      const subgroup = subgroups[subgroupId];

      if (subgroup.membersIds.some((id) => removed.includes(id))) {
        const updatedMembersIds = subgroup.membersIds.filter(
          (id) => !removed.includes(id),
        );

        transaction.update(trainingRef, {
          [`subgroups.${subgroupId}.membersIds`]: updatedMembersIds,
        });
      }
    }
  }
}
