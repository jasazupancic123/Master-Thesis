import { generateGroupStub } from '../../src/group/mock/group.stub';
import { GroupService } from '../../src/group/group.service';
import { addWeeks, addDays, subDays, setMinutes, setHours } from 'date-fns';
import { generateCycleStub } from '../../src/group/mock/cycle.stub';
import { TestUser } from '../type/auth.type';
import { InstitutionService } from '../../src/institution/service/institution.service';
import { Institution } from '../../src/institution/entity/institution.entity';
import { generateRandomName } from './random.util';

/**
 * Creates a group and 3 cycles, one for the past week, one for the current week
 * and one for the upcomming week.
 */
export async function createGroupWithCycles(
  groupService: GroupService,
  input?: {
    institutionId: string;
    owner?: TestUser;
    membersIds?: string[];
    cycleLengthInWeeks?: number;
  },
) {
  const {
    institutionId,
    owner = global.trainer,
    membersIds = [global.athlete.uid],
    cycleLengthInWeeks = 1,
  } = input || {};

  const groupStub = generateGroupStub({ membersIds });
  let group = await groupService.create(owner, {
    name: groupStub.name,
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

  group = await groupService.update(
    global.trainer,
    { groupId: group.id },
    { cycles },
  );

  return group;
}

export function createInstitution(
  institutionService: InstitutionService,
  input: Partial<Institution>,
) {
  return institutionService.create(global.admin, {
    name: input.name || generateRandomName(),
    ownerId: input.ownerId || global.manager.uid,
    trainerIds: input.trainerIds || [global.trainer.uid],
    athleteIds: input.athleteIds || [global.athlete.uid],
    imageUrl: input.imageUrl || null,
  });
}

export function getTime(date: Date, hours: number, minutes = 0) {
  return setMinutes(setHours(date, hours), minutes);
}
