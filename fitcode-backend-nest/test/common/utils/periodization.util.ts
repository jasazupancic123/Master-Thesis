import { addDays, nextWednesday } from 'date-fns';

import type {
  SubgroupRef,
  TrainingExerciseRef,
  TrainingSupersetRef,
} from '@src/common/type/firestore.type';
import { IntType, ParamType, VolType } from '@src/component/enum/param.enum';
import { generateComponentParamsStub } from '@src/component/mock/component-param.stub';
import type { Training } from '@src/training/entity/training.entity';
import { generateParamAttributeValue } from '@src/training/mock/param-values.stub';
import {
  generateExerciseSet,
  generateSuperset,
  generateTrainingComponent,
  generateTrainingExercise,
  generateTrainingStub,
} from '@src/training/mock/training.stub';

export class TestPeriodizationUtil {
  static readonly TRAININGS = [
    // base training
    this.generateTraining(0),
    // additional trainings
    this.generateTraining(2),
    this.generateTraining(4),
    this.generateTraining(7),
    this.generateTraining(14),
    this.generateTraining(28),
  ];

  static generateTraining(
    addDaysFromToday: number,
    data?: Partial<Training>,
  ): Training {
    // same param values for all sets for both left and right side
    const SETS_ALL_PARAMS = [
      generateExerciseSet(1),
      generateExerciseSet(2),
      generateExerciseSet(3),
    ];

    // sets with no intensity (only volume 1)
    const SETS_NO_INT = [
      generateExerciseSet(1, generateComponentParamsStub([ParamType.VolWork1])),
      generateExerciseSet(2, generateComponentParamsStub([ParamType.VolWork1])),
      generateExerciseSet(3, generateComponentParamsStub([ParamType.VolWork1])),
    ];

    // sets with no volume (only intensity 1)
    const SETS_NO_VOL = [
      generateExerciseSet(1, generateComponentParamsStub([ParamType.IntWork1])),
      generateExerciseSet(2, generateComponentParamsStub([ParamType.IntWork1])),
      generateExerciseSet(3, generateComponentParamsStub([ParamType.IntWork1])),
    ];

    // different param values for left and right side
    const SETS_LR_DIFFERENT = [
      generateExerciseSet(1),
      generateExerciseSet(2),
      generateExerciseSet(3),
    ];

    const reps = { field: ParamType.VolWork1, selected: VolType.Rep };
    const kg = { field: ParamType.IntWork1, selected: IntType.Kg };

    let i = 0;
    for (const set of SETS_LR_DIFFERENT) {
      set.paramValuesL = [
        generateParamAttributeValue({ ...reps, value: 20 + i }),
        generateParamAttributeValue({ ...kg, value: 30 + i }),
      ];

      set.paramValuesR = [
        generateParamAttributeValue({ ...reps, value: 22 + i }),
        generateParamAttributeValue({ ...kg, value: 34 + i }),
      ];

      i++;
    }

    const baseDay = nextWednesday(new Date());
    return generateTrainingStub({
      ownerId: 'owner',
      membersIds: [],
      date: addDays(baseDay, addDaysFromToday),
      components: [
        generateTrainingComponent({
          id: 'c1',
          supersets: [
            generateSuperset({
              exercises: [
                generateTrainingExercise({ id: 'e1', sets: SETS_ALL_PARAMS }),
                generateTrainingExercise({ id: 'e2', sets: SETS_ALL_PARAMS }),
                generateTrainingExercise({ id: 'no-int', sets: SETS_NO_INT }),
                generateTrainingExercise({ id: 'no-vol', sets: SETS_NO_VOL }),
                generateTrainingExercise({ id: 'lr', sets: SETS_LR_DIFFERENT }),
              ],
            }),
          ],
        }),
      ],
      ...(data || {}),
    });
  }

  static modifyTrainings(
    modify?: (training: Training) => Training,
  ): Training[] {
    const copied = structuredClone(this.TRAININGS);

    // modify all except the first (base) training
    for (let i = 1; i < copied.length; i++)
      if (modify) copied[i] = modify(copied[i]);

    return copied;
  }

  static expectExerciseSetValueToBe(
    training: Training,
    ref: Omit<
      SubgroupRef &
        TrainingSupersetRef &
        TrainingExerciseRef & { setIndex: number },
      'trainingId'
    >,
    data: (context: { intL: any; intR: any; volL: any; volR: any }) => void,
  ) {
    const component = training.components.find((c) => c.id === ref.componentId);
    if (!component) throw new Error(`Component ${ref.componentId} not found`);

    const subgroup = component.subgroups.find((s) => s.id === ref.subgroupId);
    const superset = (subgroup ? subgroup : component).supersets.find(
      (s, i) => i === ref.supersetIndex,
    );

    if (!superset) throw new Error(`Superset ${ref.supersetIndex} not found`);

    const exercise = superset.exercises.find((e) => e.id === ref.exerciseId);
    if (!exercise) throw new Error(`Exercise ${ref.exerciseId} not found`);

    const set = exercise.sets.find((_, i) => i === ref.setIndex);
    if (!set)
      throw new Error(
        `Set ${ref.setIndex} not found in exercise ${exercise.id}`,
      );

    const intL = set.paramValuesL.find(
      (p) => p.field === ParamType.IntWork1,
    )?.value;

    const intR = set.paramValuesR.find(
      (p) => p.field === ParamType.IntWork1,
    )?.value;

    const volL = set.paramValuesL.find(
      (p) => p.field === ParamType.VolWork1,
    )?.value;

    const volR = set.paramValuesR.find(
      (p) => p.field === ParamType.VolWork1,
    )?.value;

    data({
      intL: intL ? +intL : intL,
      intR: intR ? +intR : intR,
      volL: volL ? +volL : volL,
      volR: volR ? +volR : volR,
    });
  }

  static getExercises(training: Training, supersetIndex = 0) {
    return training.components[0].supersets[supersetIndex].exercises;
  }
}
