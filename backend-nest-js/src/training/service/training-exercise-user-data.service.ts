import { BadRequestException, Injectable } from '@nestjs/common';
import { TrainingExerciseUserDataRepository } from '../repository/training-exercise-user-data.repository';
import { TrainingExerciseMeta } from '../entity/training-exercise-meta.entity';
import { TrainingExerciseRepository } from '../repository/training-exercise.repository';
import { FirebaseService } from '../../firebase/firebase.service';
import { TrainingExerciseUserData } from '../entity/training-exercise-user-data.entity';
import { WorkloadType } from '../enum/workload-type.enum';
import { CommonService } from '../../common/service/common.service';
import { GroupRepository } from '../../group/repository/group.repository';
import { SubgroupRepository } from '../../group/repository/subgroup.repository';
import { TrainingExerciseRef } from '../../common/type/firebase-firestore.type';
import { UserRepository } from '../../user/repository/user.repository';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';

@Injectable()
export class TrainingExerciseUserDataService {
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly userRepository: UserRepository,
    private readonly groupRepository: GroupRepository,
    private readonly subgroupRepository: SubgroupRepository,
    private readonly trainingExerciseRepository: TrainingExerciseRepository,
    private readonly trainingExerciseUserDataRepository: TrainingExerciseUserDataRepository,
  ) {}

  /**
   * Gets all training exercise user data for all trainings for all users by
   * provided exercise id.
   */
  async findAll(ref: Required<TrainingExerciseRef>) {
    return await this.firebaseService.firestore
      .collectionGroup(FirestoreCollection.TRAINING_EXERCISE_USER_DATA)
      .where('exerciseId', '==', ref.exerciseId)
      .get()
      .then(({ docs }) =>
        docs.map((doc) =>
          this.trainingExerciseUserDataRepository.serialize(doc),
        ),
      );

    /*const trainings = await this.trainingRepository.getDocs(ref);

    return (
      await Promise.all(
        trainings.map(async ({ id: trainingId }) => {
          // find all training components that match the given componentId
          const trainingComponents =
            await this.trainingComponentRepository.getDocs(
              { ...ref, trainingId },
              (query) =>
                query.where(FieldPath.documentId(), '==', ref.componentId),
            );

          // find all training exercises that match the given exerciseId
          return (
            await Promise.all(
              trainingComponents.map(async ({ componentId }) => {
                const trainingExercises =
                  await this.trainingExerciseRepository.getDocs(
                    { ...ref, trainingId, componentId: componentId },
                    (query) =>
                      query.where(FieldPath.documentId(), '==', ref.exerciseId),
                  );

                return (
                  await Promise.all(
                    trainingExercises.map(async ({ exerciseId }) => {
                      return this.trainingExerciseUserDataRepository.getDocs({
                        ...ref,
                        trainingId,
                        componentId: componentId,
                        exerciseId,
                      });
                    }),
                  )
                ).flat();
              }),
            )
          ).flat();
        }),
      )
    ).flat();*/
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

    const subgroup = ref.subgroupId
      ? await this.subgroupRepository.getDoc(ref)
      : null;

    const { membersIds } = subgroup ? subgroup : group;
    const members = await this.firebaseService.authUsers({ ids: membersIds });

    // get data for all users
    const allUsersData = (await this.findAll(ref)) || [];

    // for each member, calculate individual values for exercise user data
    const batch = this.firebaseService.firestore.batch();
    for (const member of members) {
      const bodyweight = await this.userRepository.getBodyweight(member.uid);
      const userData = allUsersData.filter(
        (item) => item.userId === member.uid,
      );

      const workloadValue = this.calculateWorkloadValue(
        input.workloadType,
        input.workloadValue,
        bodyweight,
        userData,
      );

      const data: TrainingExerciseUserData = {
        userId: member.uid,
        exerciseId: ref.exerciseId,
        workloadValue,
        completedSets: 0,
      };

      const docRef = this.trainingExerciseUserDataRepository.doc({
        ...ref,
        userId: member.uid,
      });

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
    const subgroup = ref.subgroupId
      ? await this.subgroupRepository.getDoc(ref)
      : null;

    const users = await this.firebaseService.authUsers();
    const members = subgroup
      ? users.filter((user) => subgroup.membersIds.includes(user.uid))
      : users.filter((user) => group.membersIds.includes(user.uid));

    // get data for all users
    const allUsersData = await this.findAll(ref);
    const { meta } = await this.trainingExerciseRepository.getDoc(ref); // old meta

    // if nothing changed, return
    const isWorkloadTypeChanged =
      input.workloadType && input.workloadType !== meta.workloadType;
    const isWorkloadValueChanged =
      input.workloadValue && input.workloadValue !== meta.workloadValue;
    if (!isWorkloadTypeChanged && !isWorkloadValueChanged) return;

    // for each member, calculate individual values for exercise user data
    const batch = this.firebaseService.firestore.batch();
    for (const member of members) {
      const bodyweight = await this.userRepository.getBodyweight(member.uid);
      const userData = allUsersData.filter(
        (item) => item.userId === member.uid,
      );

      const workloadValue = this.calculateWorkloadValue(
        input.workloadType || meta.workloadType,
        input.workloadValue || meta.workloadValue,
        bodyweight,
        userData,
      );

      const data: TrainingExerciseUserData = {
        userId: member.uid,
        exerciseId: ref.exerciseId,
        workloadValue,
        completedSets: 0,
      };

      const docRef = this.trainingExerciseUserDataRepository.doc({
        ...ref,
        userId: member.uid,
      });

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
        const values = data.map(
          ({ completedSetTypeValue, completedWorkloadValue }) => ({
            reps: completedSetTypeValue,
            weight: +completedWorkloadValue,
          }),
        );

        return this.commonService.number.rm(values);
      case WorkloadType.BW:
        // % of bodyweight
        return (
          (bodyweight || 0) * this.commonService.number.percent(workloadValue)
        );
      case WorkloadType.KG:
      case WorkloadType.INT:
      default:
        return workloadValue;
    }
  }
}
