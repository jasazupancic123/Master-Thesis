import { Injectable } from '@nestjs/common';
import { TrainingExerciseUserDataRepository } from '../repository/training-exercise-user-data.repository';
import { TrainingExerciseMeta } from '../entity/training-exercise-meta.entity';
import { TrainingExerciseRepository } from '../repository/training-exercise.repository';
import { FirebaseService } from '../../firebase/firebase.service';
import { TrainingExerciseUserData } from '../entity/training-exercise-user-data.entity';
import { WorkloadType } from '../enum/workload-type.enum';
import { CommonService } from '../../common/service/common.service';
import { TrainingExerciseRef } from '../../common/type/firebase-firestore.type';
import { UserRepository } from '../../user/repository/user.repository';
import { FirestoreCollection } from '../../common/enum/firestore-collection.enum';
import {
  CreateTrainingExerciseUserData,
  UpdateTrainingExerciseUserData,
} from '../type/training-exercise-user-data.type';

@Injectable()
export class TrainingExerciseUserDataService {
  constructor(
    private readonly commonService: CommonService,
    private readonly firebaseService: FirebaseService,
    private readonly userRepository: UserRepository,
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
  }

  /**
   * Creates training exercise user data for group members. It takes exercise
   * meta, calculates individual values for each member and saves them to the
   * correct training component exercise user data document.
   */
  async createMany(
    ref: Required<TrainingExerciseRef>,
    input: CreateTrainingExerciseUserData,
  ): Promise<TrainingExerciseUserData[]> {
    const result: TrainingExerciseUserData[] = [];

    // find all members for the provided group (or subgroup if provided)
    const { membersIds } = input;
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
        input.meta.workloadType,
        input.meta.workloadValue,
        bodyweight,
        userData,
      );

      const data: TrainingExerciseUserData = {
        userId: member.uid,
        trainingId: ref.trainingId,
        componentId: ref.componentId,
        supersetId: ref.supersetId,
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
   * Create training exercise user data for a single user.
   */
  async create(
    ref: Required<TrainingExerciseRef>,
    userId: string,
    input: TrainingExerciseMeta,
  ): Promise<TrainingExerciseUserData> {
    const bodyweight = await this.userRepository.getBodyweight(userId);
    const userData = await this.trainingExerciseUserDataRepository.getDoc({
      ...ref,
      userId,
    });

    const workloadValue = this.calculateWorkloadValue(
      input.workloadType,
      input.workloadValue,
      bodyweight,
      userData ? [userData] : [],
    );

    const data: TrainingExerciseUserData = {
      userId,
      trainingId: ref.trainingId,
      componentId: ref.componentId,
      supersetId: ref.supersetId,
      exerciseId: ref.exerciseId,
      workloadValue,
      completedSets: 0,
    };

    const docRef = this.trainingExerciseUserDataRepository.doc({
      ...ref,
      userId,
    });

    await docRef.set(data);
    return data;
  }

  /**
   * Updates training exercise user data for group members. It takes exercise
   * meta, calculates individual values for each member and updates them in the
   * correct training component exercise user data document.
   */
  async updateMany(
    ref: Required<TrainingExerciseRef>,
    input: UpdateTrainingExerciseUserData,
  ): Promise<TrainingExerciseUserData[]> {
    const result: TrainingExerciseUserData[] = [];

    // find all members
    const members = (
      await this.trainingExerciseUserDataRepository.getDocs(ref, (collection) =>
        collection
          .where('trainingId', '==', ref.trainingId)
          .where('componentId', '==', ref.componentId)
          .where('supersetId', '==', ref.supersetId)
          .where('exerciseId', '==', ref.exerciseId),
      )
    ).map((item) => item.userId);

    // get data for all users
    const allUsersData = await this.findAll(ref);
    const { meta } = await this.trainingExerciseRepository.getDoc(ref); // old meta

    // if nothing changed, return
    const isWorkloadTypeChanged =
      input.workloadType && meta.workloadType !== meta.workloadType;
    const isWorkloadValueChanged =
      input.workloadValue && meta.workloadValue !== meta.workloadValue;
    if (!isWorkloadTypeChanged && !isWorkloadValueChanged) return;

    // for each member, calculate individual values for exercise user data
    const batch = this.firebaseService.firestore.batch();
    for (const member of members) {
      const bodyweight = await this.userRepository.getBodyweight(member);
      const userData = allUsersData.filter((item) => item.userId === member);

      const workloadValue = this.calculateWorkloadValue(
        input.workloadType || meta.workloadType,
        input.workloadValue || meta.workloadValue,
        bodyweight,
        userData,
      );

      const data: TrainingExerciseUserData = {
        userId: member,
        trainingId: ref.trainingId,
        componentId: ref.componentId,
        supersetId: ref.supersetId,
        exerciseId: ref.exerciseId,
        workloadValue,
        completedSets: 0,
      };

      const docRef = this.trainingExerciseUserDataRepository.doc({
        ...ref,
        userId: member,
      });

      batch.set(docRef, data);
      result.push(data);
    }

    await batch.commit();
    return result;
  }

  async removeAll(ref: Required<TrainingExerciseRef>) {
    return await this.firebaseService.firestore
      .collectionGroup(FirestoreCollection.TRAINING_EXERCISE_USER_DATA)
      .where('trainingId', '==', ref.trainingId)
      .where('componentId', '==', ref.componentId)
      .where('supersetId', '==', ref.supersetId)
      .where('exerciseId', '==', ref.exerciseId)
      .get()
      .then(({ docs }) => docs.forEach((doc) => doc.ref.delete()));
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
