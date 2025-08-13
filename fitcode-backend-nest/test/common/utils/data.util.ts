import { addDays, addWeeks, subDays } from 'date-fns';

import { FirestoreCollection } from '@src/common/enum/firestore-collection.enum';
import type { FirestoreEntity } from '@src/common/type/entity.type';
import type { FirebaseService } from '@src/firebase/firebase.service';
import type { GroupService } from '@src/group/group.service';
import { generateCycleStub } from '@src/group/mock/cycle.stub';
import { generateGroupStub } from '@src/group/mock/group.stub';
import type { Institution } from '@src/institution/entity/institution.entity';
import { generateInstitutionStub } from '@src/institution/mock/institution.mock';
import type { InstitutionService } from '@src/institution/service/institution.service';
import type { Training } from '@src/training/entity/training.entity';
import { generateTrainingStub } from '@src/training/mock/training.stub';

import type { TestUser } from '../type/auth.type';
import type { TestInstitution, TestTraining } from '../type/entity.type';
import {
  createAthleteUserAndToken,
  createManagerUserAndToken,
  createTrainerUserAndToken,
} from './auth.util';

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

  const institution = await institutionService.create(
    global.admin,
    generateInstitutionStub({ ownerId: manager.uid }),
  );

  for (const athlete of athletes)
    await institutionService.updateMembers(
      manager,
      { institutionId: institution.id },
      { add: true, userId: athlete.uid, trainer: false },
    );

  for (const trainer of trainers)
    await institutionService.updateMembers(
      manager,
      { institutionId: institution.id },
      { add: true, userId: trainer.uid, trainer: true },
    );

  const data = await institutionService.getDoc({
    institutionId: institution.id,
  })!;

  return { ...data, manager, trainers, athletes };
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
 * week and one for the upcomming week.
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

  const start = subDays(new Date(), 10);
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

  for (const cycle of cycles)
    await groupService.addCycle(manager, { groupId: group.id }, cycle);

  return await groupService.findOneByIdOrFail(manager, { groupId: group.id });
}

/**
 * Creates training in database. It doesn't use separate service,
 * but instead inserts raw data into database, so be careful.
 */
export async function createTraining(
  firebase: FirebaseService,
  input?: Partial<TestTraining> & { ownerId: string; membersIds: string[] },
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
