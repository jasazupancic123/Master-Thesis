import { BadRequestException, Injectable } from '@nestjs/common';
import { TrainingExerciseUserDataRepository } from '../repository/training-exercise-user-data.repository';
import { TrainingExerciseMeta } from '../entity/training-exercise-meta.entity';
import { TrainingRepository } from '../repository/training.repository';
import { TrainingComponentRepository } from '../repository/training-component.repository';
import { TrainingExerciseRepository } from '../repository/training-exercise.repository';
import { FieldPath } from 'firebase-admin/firestore';
import { FirebaseService } from '../../firebase/firebase.service';
import { TrainingExerciseUserData } from '../entity/training-exercise-user-data.entity';
import { WorkloadType } from '../enum/workload-type.enum';
import { CommonService } from '../../common/service/common.service';
import { GroupRepository } from '../../group/repository/group.repository';
import { SubgroupRepository } from '../../group/repository/subgroup.repository';
import { TrainingExerciseRef } from '../../common/type/firebase-firestore.type';

@Injectable()
export class TrainingExerciseUserDataService {
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly groupRepository: GroupRepository,
    private readonly subgroupRepository: SubgroupRepository,
    private readonly trainingRepository: TrainingRepository,
    private readonly trainingComponentRepository: TrainingComponentRepository,
    private readonly trainingExerciseRepository: TrainingExerciseRepository,
    private readonly trainingExerciseUserDataRepository: TrainingExerciseUserDataRepository,
  ) {
  }

  /**
   * Gets all training exercise user data for all trainings for all users by the
   * provided group, cycle, training, component and exercise ids: `groups/
   * {groupId}/cycles/{cycleId}/trainings/{trainingId}/components/{componentId}/
   * exercises/{exerciseId}/data` and returns flat array.
   *
   * For example, if we pass in exercise "Squats" for cycle "Preseason", this
   * function will fetch all trainings for the cycle, filter out all training
   * components that match the provided componentId, filter out all training
   * exercises that match the provided exerciseId, and return all user data for
   * that exercise. We can then use this data and filter it for a specific user
   * to get their workload value.
   */
  async findAll(ref: Required<TrainingExerciseRef>) {
    const trainings = await this.trainingRepository.getDocs(ref);

    return (await Promise.all(
      trainings.map(async ({ id: trainingId }) => {
        // find all training components that match the given componentId
        const trainingComponents = await this.trainingComponentRepository.getDocs(
          { ...ref, trainingId },
          query => query.where(FieldPath.documentId(), '==', ref.componentId),
        );

        // find all training exercises that match the given exerciseId
        return (await Promise.all(
          trainingComponents.map(async ({ componentId }) => {
            const trainingExercises = await this.trainingExerciseRepository.getDocs(
              { ...ref, trainingId, componentId },
              query => query.where(FieldPath.documentId(), '==', ref.exerciseId),
            );

            return (await Promise.all(
              trainingExercises.map(async ({ exerciseId }) => {
                return this.trainingExerciseUserDataRepository.getDocs({ ...ref, trainingId, componentId, exerciseId });
              }),
            )).flat();
          }),
        )).flat();
      }),
    )).flat();
  }

  /**
   * Creates training exercise user data for group members. It takes exercise
   * meta, calculates individual values for each member and saves them to the
   * correct training component exercise user data document.
   */
  async createMany(
    ref: Required<TrainingExerciseRef>,
    input: TrainingExerciseMeta,
  ): Promise<TrainingExerciseUserData[]> {
    const result: TrainingExerciseUserData[] = [];

    // find all members for the provided group (or subgroup if provided)
    const group = await this.groupRepository.getDoc(ref);
    if (!group) throw new BadRequestException('Group not found');

    const subgroup = ref.subgroupId ? await this.subgroupRepository.getDoc(ref) : null;
    if (ref.subgroupId && !subgroup) throw new BadRequestException('Subgroup not found');

    const users = await this.firebaseService.authUsers();
    const members = subgroup
      ? users.filter((user) => subgroup.membersIds.includes(user.uid))
      : users.filter((user) => group.membersIds.includes(user.uid));

    // get data for all users
    const userData = await this.findAll(ref);

    // for each member, calculate individual values for exercise user data
    const batch = this.firebaseService.firestore.batch();
    for (const member of members) {
      const memberData = userData.filter((item) => item.userId === member.uid);
      const workloadValue = this.calculateWorkloadValue(
        input.workloadType,
        input.workloadValue,
        member.customClaims.bodyweight,
        memberData,
      );

      const data: TrainingExerciseUserData = {
        userId: member.uid,
        workloadValue,
        completedSets: 0,
      };

      const docRef = this.trainingExerciseUserDataRepository.doc({ ...ref, userId: member.uid });
      batch.set(docRef, data);
      result.push(data);
    }

    await batch.commit();
    return result;
  }

  /**
   * Updates training exercise user data for group members. It takes exercise
   * meta, calculates individual values for each member and updates them in the
   * correct training component exercise user data document.
   */
  async updateMany(
    ref: Required<TrainingExerciseRef>,
    input: Partial<TrainingExerciseMeta>,
  ): Promise<TrainingExerciseUserData[]> {
    const result: TrainingExerciseUserData[] = [];

    // find all members for the provided group
    const group = await this.groupRepository.getDoc(ref);
    if (!group) throw new BadRequestException('Group not found');

    const subgroup = await this.subgroupRepository.getDoc(ref);
    if (ref.subgroupId && !subgroup) throw new BadRequestException('Subgroup not found');

    const users = await this.firebaseService.authUsers();
    const members = subgroup
      ? users.filter((user) => subgroup.membersIds.includes(user.uid))
      : users.filter((user) => group.membersIds.includes(user.uid));

    // get data for all users
    const userData = await this.findAll(ref);
    const { meta } = await this.trainingExerciseRepository.getDoc(ref); // old meta

    // if nothing changed, return
    const isWorkloadTypeChanged = input.workloadType && input.workloadType !== meta.workloadType;
    const isWorkloadValueChanged = input.workloadValue && input.workloadValue !== meta.workloadValue;
    if (!isWorkloadTypeChanged && !isWorkloadValueChanged)
      return;

    // for each member, calculate individual values for exercise user data
    const batch = this.firebaseService.firestore.batch();
    for (const member of members) {
      const memberData = userData.filter((item) => item.userId === member.uid);
      const workloadValue = this.calculateWorkloadValue(
        input.workloadType || meta.workloadType,
        input.workloadValue || meta.workloadValue,
        member.customClaims.bodyweight,
        memberData,
      );

      const data: TrainingExerciseUserData = {
        userId: member.uid,
        workloadValue,
        completedSets: 0,
      };

      const docRef = this.trainingExerciseUserDataRepository.doc({ ...ref, userId: member.uid });
      batch.set(docRef, data);
      result.push(data);
    }

    await batch.commit();
    return result;
  }

  private calculateWorkloadValue(
    workloadType: WorkloadType,
    workloadValue: number,
    bodyweight: number,
    data: TrainingExerciseUserData[],
  ) {
    switch (workloadType) {
      case WorkloadType.RM:
        // fetch 1RM from last month of user exercises, use formula and save value as KG
        const values = data.map(({ completedSetTypeValue, completedWorkloadValue }) => ({
          reps: completedSetTypeValue,
          weight: +completedWorkloadValue,
        }));

        return this.commonService.number.rm(values);
      case WorkloadType.BW:
        // % of bodyweight
        return bodyweight * this.commonService.number.percent(workloadValue);
      case WorkloadType.KG:
      case WorkloadType.INT:
      default:
        return workloadValue;
    }
  }
}