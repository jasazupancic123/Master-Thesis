import { generateGroupStub } from '../../../src/group/mock/group.stub';
import { GroupService } from '../../../src/group/group.service';
import { addWeeks, addDays, subDays } from 'date-fns';
import { generateCycleStub } from '../../../src/group/mock/cycle.stub';
import { TestUser } from '../type/auth.type';
import { Institution } from '../../../src/institution/entity/institution.entity';
import { InstitutionService } from '../../../src/institution/service/institution.service';
import { generateInstitutionStub } from '../../../src/institution/mock/institution.mock';
import { FirestoreCollection } from '../../../src/common/enum/firestore-collection.enum';
import { FirebaseService } from '../../../src/firebase/firebase.service';
import { TestInstitution, TestTraining } from '../type/entity.type';
import {
  createAthleteUserAndToken,
  createManagerUserAndToken,
  createTrainerUserAndToken,
} from './auth.util';
import { Training } from '../../../src/training/entity/training.entity';
import { generateTrainingStub } from '../../../src/training/mock/training.stub';
import { FirestoreEntity } from '../../../src/common/type/entity.type';
import { TrainingExercise } from '../../../src/training/entity/training-exercise.entity';
import { Workload } from '../../../src/training/entity/workload.entity';
import { generateWorkloadStub } from '../../../src/training/mock/workload.stub';
import { SetStatus } from '../../../src/training/enum/set-status.enum';
import { BatchWriteOperation } from '../../../src/common/type/firestore.type';

/**
 * Creates only institution with owner and members (trainers and athletes).
 * It defaults to global users.
 */
export async function createInstitution(
  institutionService: InstitutionService,
  input?: {
    manager?: TestUser;
    athletes?: TestUser[];
    trainers?: TestUser[];
  },
): Promise<TestInstitution> {
  const manager = input?.manager || global.manager;
  const athletes = input?.athletes || [global.athlete];
  const trainers = input?.trainers || [global.trainer];

  const athleteIds = athletes.map((a) => a.uid);
  const trainerIds = trainers.map((a) => a.uid);

  const institution = await institutionService.create(
    global.admin,
    generateInstitutionStub({ ownerId: manager.uid }),
  );

  await institutionService.updateMembers(
    manager,
    { institutionId: institution.id },
    { add: true, trainers: false, memberIds: athleteIds },
  );

  await institutionService.updateMembers(
    manager,
    { institutionId: institution.id },
    { add: true, trainers: true, memberIds: trainerIds },
  );

  const data = await institutionService.getDoc({
    institutionId: institution.id,
  })!;

  return { ...data, manager: manager, trainers, athletes };
}

/**
 * Creates an institution and its manager, trainer and athlete members.
 * It uses custom service to do so, so database contains everything
 * necessary. It returns an array, where first element is TestInstitution,
 * second one is trainer, and the last one is athlete.
 */
export async function createInstitutionWithUsers(
  firebase: FirebaseService,
  institutionService: InstitutionService,
  input?: {
    additionalAthletes?: TestUser[];
    additionalTrainers?: TestUser[];
  },
): Promise<TestInstitution> {
  const [manager, athlete, trainer] = await Promise.all([
    createManagerUserAndToken(firebase),
    createAthleteUserAndToken(firebase),
    createTrainerUserAndToken(firebase),
  ]);

  return await createInstitution(institutionService, {
    manager,
    athletes: [athlete, ...(input?.additionalAthletes || [])],
    trainers: [trainer, ...(input?.additionalTrainers || [])],
  });
}

/**
 * Creates only a group and 3 cycles, one for the past week, one for the current
 * week and one for the upcomming week. Defaults to institution users. It uses
 * custom service to do so, so database contains everything necessary.
 */
export async function createGroupWithCycles(
  groupService: GroupService,
  institution: TestInstitution,
  input?: {
    manager?: TestUser;
    trainerId?: string;
    membersIds?: string[];
    cycleLengthInWeeks?: number;
  },
) {
  const {
    trainerId = institution.trainerIds[0],
    manager = institution.manager,
    membersIds = institution.athleteIds,
    cycleLengthInWeeks = 1,
  } = input || {};

  const groupStub = generateGroupStub({ membersIds });
  let group = await groupService.create(manager, {
    institutionId: institution.id,
    name: groupStub.name,
    ownerId: trainerId,
    membersIds: groupStub.membersIds,
  });

  const start = subDays(new Date(), 7);
  const cycles = [
    generateCycleStub({
      from: start,
      to: addWeeks(start, cycleLengthInWeeks),
    }),
    generateCycleStub({
      from: addDays(addWeeks(start, cycleLengthInWeeks), 1),
      to: addDays(addWeeks(start, 2 * cycleLengthInWeeks), 1),
    }),
    generateCycleStub({
      from: addDays(addWeeks(start, 2 * cycleLengthInWeeks), 1),
      to: addDays(addWeeks(start, 3 * cycleLengthInWeeks), 1),
    }),
  ];

  group = await groupService.update(manager, { groupId: group.id }, { cycles });
  return group;
}

/**
 * Creates training in database. It doesn't use separate service,
 * but instead inserts raw data into database, so be careful.
 */
export async function createTraining(
  firebase: FirebaseService,
  input?: Partial<TestTraining>,
) {
  const data: TestTraining = {
    ...generateTrainingStub(input),
    group: input?.group,
  };

  const collection = firebase.firestore.collection(
    FirestoreCollection.TRAINING,
  );

  const { id } = collection.doc();

  const query = firebase.buildCreateQuery<Training>(
    generateTrainingStub({
      ...input,
      id,
      institutionId: data.institutionId || input?.group?.institutionId,
      groupId: data.groupId || input?.group?.id,
      ownerId: data?.ownerId || global.trainer.uid,
      membersIds: data?.group?.membersIds ||
        data?.membersIds || [global.athlete.uid],
    }),
  );

  await firebase.firestore
    .collection(FirestoreCollection.TRAINING)
    .doc(id)
    .set(query);

  return await firebase.firestore
    .collection(FirestoreCollection.TRAINING)
    .doc(id)
    .get()
    .then((result) =>
      firebase.serialize(result.data() as FirestoreEntity<Training>),
    );
}

/**
 * Creates workloads for training in database. It doesn't use separate
 * service, but instead inserts raw data into database, so be careful.
 */
export function createWorkloadsForTraining(
  firebase: FirebaseService,
  training: Training,
  options?: {
    completed?: boolean;
  },
) {
  const membersMap: {
    [userId: string]: {
      exercises: (TrainingExercise & { componentId: string })[];
    };
  } = {};

  for (const userId of training.membersIds)
    membersMap[userId] = { exercises: [] };

  for (const component of training.components) {
    // workloads for main training group
    for (const superset of component.supersets)
      for (const exercise of superset.exercises)
        for (const userId of training.membersIds)
          membersMap[userId].exercises.push({
            ...exercise,
            componentId: component.id,
          });

    // workloads for subgroups
    for (const subgroup of component.subgroups)
      for (const superset of subgroup.supersets)
        for (const exercise of superset.exercises)
          for (const userId of subgroup.membersIds)
            membersMap[userId].exercises.push({
              ...exercise,
              componentId: component.id,
            });
  }

  if (Object.keys(membersMap).length !== 20)
    console.log('not 20 mmembers, but', Object.keys(membersMap).length);

  // for each member, calculate individual values for exercise user data
  const workloads: Workload[] = [];
  for (const userId of Object.keys(membersMap))
    for (const exercise of membersMap[userId].exercises)
      for (const { setNumber } of exercise.sets)
        workloads.push(
          generateWorkloadStub({
            groupId: training.groupId,
            cycleId: training.cycleId,
            userId,
            trainingId: training.id,
            componentId: exercise.componentId,
            exerciseId: exercise.id,
            setNumber,
            status: SetStatus.NOT_STARTED,
            plannedAt: training.from,
            notes: null,
            isCustom: false,
          }),
        );

  const operations: BatchWriteOperation<Workload>[] = [];
  for (const workload of workloads) {
    const ref = firebase.firestore
      .collection(FirestoreCollection.TRAINING)
      .doc(training.id)
      .collection(FirestoreCollection.TRAINING_WORKLOAD)
      .doc();

    const data = firebase.buildCreateQuery<Workload>(workload);
    operations.push({ data, ref, operation: 'set' });
  }

  return operations;
}

export async function deleteDoc(
  firebase: FirebaseService,
  path: keyof typeof FirestoreCollection,
  id: string,
) {
  const docRef = firebase.firestore
    .collection(FirestoreCollection[path])
    .doc(id);

  await firebase.firestore.recursiveDelete(docRef);
}

export async function deleteDocs(
  firebase: FirebaseService,
  path: keyof typeof FirestoreCollection,
  ids: string[],
) {
  const collection = firebase.firestore.collection(FirestoreCollection[path]);
  await Promise.all(
    ids.map((id) => firebase.firestore.recursiveDelete(collection.doc(id))),
  );
}

export async function deleteCollection(
  firebase: FirebaseService,
  path: keyof typeof FirestoreCollection,
) {
  const collection = firebase.firestore.collection(FirestoreCollection[path]);
  await firebase.firestore.recursiveDelete(collection);
}

export async function deleteUsers(
  firebase: FirebaseService,
  users: TestUser[],
) {
  await Promise.all([
    deleteDocs(
      firebase,
      'USER',
      users.map((u) => u.uid),
    ),
    firebase.auth.deleteUsers(users.map((u) => u.uid)),
  ]);
}

export async function deleteUsersByIds(
  firebase: FirebaseService,
  userIds: string[],
) {
  await Promise.all([
    deleteDocs(firebase, 'USER', userIds),
    firebase.auth.deleteUsers(userIds),
  ]);
}

/**
 * Deletes institution and its users (owner, trainers and athletes).
 * It does not delete its groups and other relations.
 */
export async function deleteInstitution(
  firebase: FirebaseService,
  institution: Institution,
) {
  const ownerId =
    institution.ownerId === global.manager.uid ? null : institution.ownerId;

  const athleteIds = institution.athleteIds.filter(
    (id) => id !== global.athlete.uid,
  );

  const trainerIds = institution.trainerIds.filter(
    (id) => id !== global.trainer.uid,
  );

  await Promise.all([
    deleteDoc(firebase, 'INSTITUTION', institution.id),
    deleteUsersByIds(
      firebase,
      [ownerId, ...athleteIds, ...trainerIds].filter((id) => id),
    ),
  ]);
}
