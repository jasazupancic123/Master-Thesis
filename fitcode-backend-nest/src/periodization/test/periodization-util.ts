import { addDays, nextWednesday } from 'date-fns';

import { MAIN_GROUP_PARENT_ID } from '@src/training/constant/main-group-parent-id.constant';
import type { Training } from '@src/training/entity/training.entity';
import type { TrainingExercise } from '@src/training/entity/training-exercise.entity';
import {
  generateExerciseSet,
  generateSubgroup,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';

export const testBaseTrainingComplexPeriodization =
  generateComplexPeriodizationTraining(
    0,
    {
      id: 'c1',
      exercise: generateTrainingExercise({
        id: 'yoyo',
        sets: [
          generateExerciseSet(1, { time: 60 }),
          generateExerciseSet(2, { time: 65 }),
          generateExerciseSet(3, { time: 70 }),
        ],
      }),
    },
    {
      id: 'main-sg-1',
      exercise: generateTrainingExercise({
        id: 'yoyo',
        sets: [
          generateExerciseSet(1, { dist: 30 }),
          generateExerciseSet(2, { dist: 30 }),
        ],
      }),
    },
    {
      id: 'main-sg-2',
      exercise: generateTrainingExercise({
        id: 'yoyo',
        sets: [
          generateExerciseSet(1, { time: 40 }),
          generateExerciseSet(2, { time: 40 }),
          generateExerciseSet(3, { time: 40 }),
          generateExerciseSet(4, { time: 40 }),
        ],
      }),
    },
    {
      id: 'root-sg',
      exercise: generateTrainingExercise({
        id: 'sled-push',
        sets: [
          generateExerciseSet(1, { dist: 50, loadBw: 20 }),
          generateExerciseSet(2, { dist: 60, loadBw: 25 }),
          generateExerciseSet(3, { dist: 70, loadBw: 30 }),
        ],
      }),
    },
    {
      id: 'child-sg-1',
      exercise: generateTrainingExercise({
        id: 'sled-push',
        sets: [
          generateExerciseSet(1, { dist: 20, loadBw: 10 }),
          generateExerciseSet(2, { dist: 25, loadBw: 15 }),
        ],
      }),
    },
  );

function generateComplexPeriodizationTraining(
  addDaysFromToday: number,
  main: { id: string; exercise: TrainingExercise },
  mainChild1: { id: string; exercise: TrainingExercise },
  mainChild2: { id: string; exercise: TrainingExercise },
  subgroup: { id: string; exercise: TrainingExercise },
  subgroupChild1: { id: string; exercise: TrainingExercise },
): Training {
  const baseDay = nextWednesday(new Date());

  return generateTrainingStub({
    ownerId: 'owner',
    membersIds: [],
    date: addDays(baseDay, addDaysFromToday),
    components: [
      generateTrainingComponent({
        id: main.id,
        supersets: [generateSuperset({ exercises: [main.exercise] })],
        subgroups: [
          generateSubgroup({
            id: mainChild1.id,
            parentId: MAIN_GROUP_PARENT_ID,
            supersets: [generateSuperset({ exercises: [mainChild1.exercise] })],
          }),
          generateSubgroup({
            id: mainChild2.id,
            parentId: MAIN_GROUP_PARENT_ID,
            supersets: [generateSuperset({ exercises: [mainChild2.exercise] })],
          }),
          generateSubgroup({
            id: subgroup.id,
            supersets: [generateSuperset({ exercises: [subgroup.exercise] })],
          }),
          generateSubgroup({
            id: subgroupChild1.id,
            parentId: subgroup.id,
            supersets: [
              generateSuperset({ exercises: [subgroupChild1.exercise] }),
            ],
          }),
        ],
      }),
    ],
  });
}

export const testComplexPeriodizationTrainings = [];
