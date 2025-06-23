import { generateGroupStub } from '../../../src/group/mock/group.stub';
import { GroupService } from '../../../src/group/group.service';
import { addWeeks, addDays, subDays, setMinutes, setHours } from 'date-fns';
import { generateCycleStub } from '../../../src/group/mock/cycle.stub';
import { TestUser } from '../type/auth.type';
import { Institution } from '../../../src/institution/entity/institution.entity';
import { InstitutionService } from '../../../src/institution/service/institution.service';
import { generateInstitutionStub } from '../../../src/institution/mock/institution.mock';
import { FirestoreCollection } from '../../../src/common/enum/firestore-collection.enum';
import { FirebaseService } from '../../../src/firebase/firebase.service';

export async function createInstitution(
  institutionService: InstitutionService,
  input?: Partial<Institution> & { owner: TestUser },
): Promise<Institution> {
  const owner = input?.owner || global.manager;
  const ownerId = input?.ownerId || owner?.uid;
  const athleteIds = input?.athleteIds || [global.athlete.uid];
  const trainerIds = input?.trainerIds || [global.trainer.uid];

  const institution = await institutionService.create(
    global.admin,
    generateInstitutionStub({ ...input, ownerId }),
  );

  await institutionService.updateMembers(
    owner,
    { institutionId: institution.id },
    { add: true, trainers: false, memberIds: athleteIds },
  );

  await institutionService.updateMembers(
    owner,
    { institutionId: institution.id },
    { add: true, trainers: true, memberIds: trainerIds },
  );

  return await institutionService.getDoc({ institutionId: institution.id })!;
}

/**
 * Creates a group and 3 cycles, one for the past week, one for the current week
 * and one for the upcomming week.
 */
export async function createGroupWithCycles(
  groupService: GroupService,
  input?: {
    institutionId: string;
    trainer?: TestUser;
    manager?: TestUser;
    membersIds?: string[];
    cycleLengthInWeeks?: number;
  },
) {
  const {
    institutionId,
    trainer = global.trainer,
    manager = global.manager,
    membersIds = [global.athlete.uid],
    cycleLengthInWeeks = 1,
  } = input || {};

  const groupStub = generateGroupStub({ membersIds });
  let group = await groupService.create(manager, {
    name: groupStub.name,
    ownerId: trainer.uid,
    membersIds: groupStub.membersIds,
    institutionId,
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

export function getTime(date: Date, hours: number, minutes = 0) {
  return setMinutes(setHours(date, hours), minutes);
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
