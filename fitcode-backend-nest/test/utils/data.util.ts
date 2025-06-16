import { generateGroupStub } from '../../src/group/mock/group.stub';
import { GroupService } from '../../src/group/group.service';
import { addWeeks, addDays, subDays, setMinutes, setHours } from 'date-fns';
import { generateCycleStub } from '../../src/group/mock/cycle.stub';
import { TestUser } from '../type/auth.type';

/**
 * Creates a group and 3 cycles, one for the past week, one for the current week
 * and one for the upcomming week.
 */
export async function createGroupWithCycles(
  groupService: GroupService,
  input?: {
    owner?: TestUser;
    membersIds?: string[];
  },
) {
  const { owner = global.trainer, membersIds = [global.athlete.uid] } =
    input || {};

  const groupStub = generateGroupStub({ membersIds });
  let group = await groupService.create(owner, {
    name: groupStub.name,
    membersIds: groupStub.membersIds,
    institutionId: global.institution.id,
  });

  const start = subDays(new Date(), 7);
  const cycles = [
    generateCycleStub({
      from: start,
      to: addWeeks(start, 1),
    }),
    generateCycleStub({
      from: addDays(addWeeks(start, 1), 1),
      to: addDays(addWeeks(start, 2), 1),
    }),
    generateCycleStub({
      from: addDays(addWeeks(start, 2), 1),
      to: addDays(addWeeks(start, 3), 1),
    }),
  ];

  group = await groupService.update(
    global.trainer,
    { groupId: group.id },
    { cycles },
  );
  return group;
}

export function getTime(date: Date, hours: number, minutes = 0) {
  return setMinutes(setHours(date, hours), minutes);
}
