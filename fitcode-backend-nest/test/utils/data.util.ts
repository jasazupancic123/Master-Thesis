import { User } from '../../src/common/type/firebase-auth.type';
import { GroupService } from '../../src/group/group.service';
import { Cycle } from '../../src/group/entity/cycle.entity';
import { TrainingService } from '../../src/training/service/training.service';
import { CreateTrainingDto } from '../../src/training/dto/create-training.dto';
import { v4 } from 'uuid';
import { generateRandomName } from './random.util';
import {
  addDays,
  addHours,
  addMonths,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns';
import { Group } from '../../src/group/entity/group.entity';
import { Training } from '../../src/training/entity/training.entity';
import { Component } from '../../src/component/entity/component.entity';

export async function createGroupWithCyclesAndTrainings(
  groupService: GroupService,
  trainingService: TrainingService,
  owner: User,
  components: Component[],
  input: {
    name?: string;
    membersIds: string[];
    numCycles?: number;
    numTrainingsPerCycle?: number;
    cycles?: (Cycle & {
      trainings?: Omit<CreateTrainingDto, 'groupId' | 'cycleId'>[];
    })[];
  } = {
    name: generateRandomName(),
    membersIds: [],
    numCycles: 3,
    numTrainingsPerCycle: 5,
  },
): Promise<[Group, Cycle[], Training[]]> {
  // create group
  let group = await groupService.create(owner, {
    name: input.name,
    membersIds: input.membersIds,
  });

  // add cycles
  // current month is first day of the previous month
  const from = startOfMonth(subMonths(new Date(), 1));
  group = await groupService.update(
    owner,
    { groupId: group.id },
    {
      cycles:
        input.cycles?.map((c) => {
          const { trainings: _, ...cycle } = c;
          return cycle;
        }) ??
        // create dummy cycles if no cycles input
        Array.from({ length: input.numCycles }).map((_, i) => ({
          id: v4(),
          name: generateRandomName(),
          from: addMonths(from, i),
          to: subDays(addMonths(from, i + 1), 1),
          rootComponentsIds: [],
          leafComponentsIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
    },
  );

  // create trainings
  const trainings: Training[] = [];
  await Promise.all(
    group.cycles.map((c) => {
      const cycle = input.cycles
        ? input.cycles.find((cycle) => cycle.id === c.id)
        : c;

      if (input.cycles) {
        const cycle = input.cycles.find((cycle) => cycle.id === c.id);
        if (input.cycles.find((cycle) => cycle.id === c.id))
          cycle.trainings.map(async (t) => {
            trainings.push(
              await trainingService.create(owner, {
                groupId: group.id,
                cycleId: cycle.id,
                from: t.from,
                to: t.to,
                componentsIds: t.componentsIds,
                copiedFromId: null,
              }),
            );
          });
      } else
        // create dummy trainings if no cycles input
        Array.from({ length: input.numTrainingsPerCycle }).map(async (_) => {
          const from = addDays(c.from, 1);
          trainings.push(
            await trainingService.create(owner, {
              groupId: group.id,
              cycleId: cycle.id,
              from,
              to: addHours(from, 2),
              componentsIds: components.map((c) => c.id),
              copiedFromId: null,
            }),
          );
        });
    }),
  );

  return [group, group.cycles, trainings];
}
