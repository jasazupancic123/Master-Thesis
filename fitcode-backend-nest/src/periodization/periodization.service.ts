import { BadRequestException, Injectable } from '@nestjs/common';

import { CommonService } from '@src/common/service/common.service';
import type {
  SubgroupRef,
  TrainingComponentRef,
} from '@src/common/type/firestore.type';
import { MAIN_GROUP_PARENT_ID } from '@src/training/constant/main-group-parent-id.constant';
import {
  MAX_NUM_EXERCISES_IN_BLOCK_SUPERSET,
  MAX_NUM_EXERCISES_IN_CIRCUIT_SUPERSET,
  MAX_NUM_SUPERSETS_IN_BLOCK_COMPONENT,
} from '@src/training/constant/training-limits.constant';
import {
  ExerciseParamField,
  ExerciseSet,
} from '@src/training/entity/exercise-set.entity';
import { Subgroup } from '@src/training/entity/subgroup.entity';
import { Training } from '@src/training/entity/training.entity';
import { TrainingComponent } from '@src/training/entity/training-component.entity';
import { TrainingExercise } from '@src/training/entity/training-exercise.entity';
import { MainSet } from '@src/training/enum/main-set.enum';
import { PeriodizationType } from '@src/training/enum/periodization-type.enum';

import { PeriodizationStrategy } from './strategy/periodization.strategy';
import { AutoregulatoryPeriodizationStrategy } from './strategy/periodization-autoregulatory.strategy';
import { BlockPeriodizationStrategy } from './strategy/periodization-block.strategy';
import { DayUndulatingPeriodizationStrategy } from './strategy/periodization-day-undulating.strategy';
import { LinearPeriodizationStrategy } from './strategy/periodization-linear.strategy';
import { ReplicatePeriodizationStrategy } from './strategy/periodization-replicate.strategy';
import { WavePeriodizationStrategy } from './strategy/periodization-wave.strategy';
import { WeekUndulatingPeriodizationStrategy } from './strategy/periodization-week-undulating.strategy';

@Injectable()
export class PeriodizationService {
  private strategiesMap = new Map<PeriodizationType, PeriodizationStrategy>();

  constructor(private readonly common: CommonService) {
    const strategies: PeriodizationStrategy[] = [
      new ReplicatePeriodizationStrategy(),
      new LinearPeriodizationStrategy(),
      new WeekUndulatingPeriodizationStrategy(),
      new DayUndulatingPeriodizationStrategy(),
      new BlockPeriodizationStrategy(),
      new WavePeriodizationStrategy(),
      new AutoregulatoryPeriodizationStrategy(),
      // new DupTableBasedPeriodizationStrategy(),
    ];

    strategies.forEach((s) => this.strategiesMap.set(s.type, s));
  }

  getStrategy(type: PeriodizationType): PeriodizationStrategy {
    const strategy = this.strategiesMap.get(type);
    if (!strategy)
      throw new BadRequestException(
        `Periodization type ${type} not implemented`,
      );

    return strategy;
  }

  periodize(
    type: PeriodizationType,
    ref: TrainingComponentRef & SubgroupRef,
    trainings: Training[],
    exerciseIds?: string[], // if not provided, will use all exercises from the base training
    options?: {
      createExerciseIfNotExistsInTrainings?: boolean; // if true, will create new exercise in upcoming trainings if not found
      dontPeriodizeChildSubgroups?: boolean; // if true, will not periodize subgroups of the base training
    },
  ): Training[] {
    if (trainings.length <= 1) return trainings;

    const periodized: Training[] = structuredClone(trainings);
    const weeks = this.getSpacedTrainingsByWeek(periodized);
    const strategy = this.getStrategy(type);

    const baseTraining = periodized[0];
    const baseItems: (TrainingComponent | Subgroup)[] = [];
    const baseItem = this.getRefItem(baseTraining, ref);
    if (!baseItem) return periodized;
    baseItems.push(baseItem);

    // special case - periodize direct children of the main group (component itself) with special id
    const baseComponent = this.getComponent(baseTraining, ref)!;

    // periodize all child subgroups of provided subgroup
    if (!options?.dontPeriodizeChildSubgroups)
      for (let i = 0; i < baseComponent.subgroups.length; i++) {
        const child = baseComponent.subgroups[i];

        if (!ref.subgroupId && child.parentId === MAIN_GROUP_PARENT_ID)
          baseItems.push(child); // periodize direct child subgroups of the component (main group)
        else if (
          child.id !== ref.subgroupId &&
          child.parentId === ref.subgroupId
        )
          baseItems.push(child);
      }

    for (const baseItem of baseItems) {
      const baseExercises = this.getExercises(baseItem);

      // if no exercises provided, use all exercises from the base training
      if (!exerciseIds || exerciseIds.length === 0)
        exerciseIds = baseExercises.map((e) => e.id);

      for (const exerciseId of exerciseIds) {
        const baseExercise = baseExercises.find((e) => e.id === exerciseId);
        if (!baseExercise) continue; // no base exercise to periodize, skip

        // initialize previous intensity and volume for each set as base values
        const baseSetValues = this.getBaseSetValues(baseExercise);
        let prevIntL = baseSetValues.map((s, i) => ({ i, value: s.baseIntL }));
        let prevVolL = baseSetValues.map((s, i) => ({ i, value: s.baseVolL }));
        let prevIntR = baseSetValues.map((s, i) => ({ i, value: s.baseIntR }));
        let prevVolR = baseSetValues.map((s, i) => ({ i, value: s.baseVolR }));

        for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
          for (
            let dayIndex = 0;
            dayIndex < weeks[weekIndex].length;
            dayIndex++
          ) {
            // find exercise to periodize
            const training = weeks[weekIndex][dayIndex];
            const item = this.getRefItem(training, {
              ...ref,
              subgroupId: this.isSubgroup(baseItem) ? baseItem.id : undefined,
            });

            if (!item) continue; // component / subgroup not found in upcoming training, skip

            const exercises = this.getExercises(item);
            const foundExercise = exercises.find((e) => e.id === exerciseId);
            const exercise = foundExercise
              ? foundExercise
              : options?.createExerciseIfNotExistsInTrainings
                ? structuredClone(baseExercise)
                : undefined;

            if (!exercise) continue; // skip if no exercise to periodize

            // override upcoming exercise
            exercise.sets = structuredClone(baseExercise.sets);
            const readinessFactor = Math.random() * 0.2 + 0.9; // simulate readiness factor between 0.9 and 1.1

            for (const baseSet of baseExercise.sets) {
              const set = exercise.sets[baseSet.setNumber - 1];

              const { setIndex, baseIntL, baseVolL, baseIntR, baseVolR } =
                baseSetValues.find(
                  (s) => s.setIndex === baseSet.setNumber - 1,
                )!;

              for (const lr of ['L', 'R'] as const) {
                const baseIntensity = lr === 'L' ? baseIntL : baseIntR;
                const baseVolume = lr === 'L' ? baseVolL : baseVolR;
                const prevInt = lr === 'L' ? prevIntL : prevIntR;
                const prevVol = lr === 'L' ? prevVolL : prevVolR;

                const { intensity, volume } = strategy.periodize({
                  weekIndex,
                  dayIndex,
                  weeksLength: weeks.length,
                  baseIntensity,
                  baseVolume,
                  readinessFactor,
                  prevVolume: prevVol.find((int) => int.i === setIndex)?.value,
                  prevIntensity: prevInt.find((int) => int.i === setIndex)
                    ?.value,
                });

                const foundInt = this.getIntParamValue(lr, set);
                const foundVol = this.getVolParamValue(lr, set);

                if (foundInt) {
                  set[foundInt.field] = intensity as never;
                  updatePreviousValue(prevInt, intensity);
                }

                if (foundVol) {
                  set[foundVol.field] = volume as never;
                  updatePreviousValue(prevVol, volume);
                }

                function updatePreviousValue(
                  item: { i: number; value: number }[],
                  newValue: number,
                ) {
                  const foundItem = item.find((v) => v.i === setIndex);
                  if (foundItem) foundItem.value = newValue;
                }
              }
            }

            // if exercise not found in training and option to create is enabled, insert training exercise
            if (!foundExercise && exercise) {
              const superset = this.getAvailableSuperset(item);
              if (superset !== -1)
                item.supersets[superset].exercises.push(exercise);
            }
          }
        }
      }
    }

    return periodized;
  }

  getAvailableSuperset(item: TrainingComponent | Subgroup): number {
    // circuit can have max 1 superset and max 32 exercises in it
    if (item.mainSet === MainSet.CIRCUIT) {
      if (
        item.supersets.length &&
        item.supersets[0].exercises.length <
          MAX_NUM_EXERCISES_IN_CIRCUIT_SUPERSET
      )
        return 0;

      return -1;
    }

    // each superset can have max 4 exercises, so find first superset with less than 4 exercises
    for (let i = 0; i < item.supersets.length; i++)
      if (
        item.supersets[i].exercises.length < MAX_NUM_EXERCISES_IN_BLOCK_SUPERSET
      )
        return i;

    // if all supersets are full, check if we can create a new one (max 8 supersets) and create it
    if (item.supersets.length < MAX_NUM_SUPERSETS_IN_BLOCK_COMPONENT) {
      item.supersets = [...item.supersets, { exercises: [] }];
      return item.supersets.length - 1; // return index of the newly created superset
    }

    // no available superset found, do not create a new one
    return -1;
  }

  getComponent(
    training: Training,
    ref: TrainingComponentRef,
  ): TrainingComponent {
    return training.components.find((c) => c.id === ref.componentId);
  }

  getRefItem(
    training: Training,
    ref: TrainingComponentRef & SubgroupRef,
  ): TrainingComponent | Subgroup | null {
    const component = this.getComponent(training, ref);
    if (!component) return null;
    if (!ref.subgroupId) return component;

    const subgroup = component.subgroups.find((s) => s.id === ref.subgroupId);
    return subgroup || null;
  }

  getExercises(item: TrainingComponent | Subgroup): TrainingExercise[] {
    return item.supersets.flatMap((s) => s.exercises);
  }

  /**
   * Generates weeks between first and last training and fills in all
   * of the trainings. For example, we have 3 trainings, 2 in first
   * week and one in the second week. Returns array of 2 elements,
   * first containing the first 2 trainings and the second containing
   * the last training.
   *
   * @example
   * ```ts
   * const trainings = [
   *  { from: '2025-10-01' },
   *  { from: '2025-14-01' },
   *  { from: '2025-21-01' },
   * ]
   *
   * const firstTraining = trainings[0];
   * const lastTraining = trainings[trainings.length - 1];
   *
   * const result = getSpacedTrainingsByWeek(
   *  firstTraining,
   *  lastTraining,
   *  trainings,
   * );
   * // => [
   * //   [{ from: '2025-10-01' }, { from: '2025-14-01' }],
   * //   [{ from: '2025-21-01' }]
   * // ]
   * ```
   */
  private getSpacedTrainingsByWeek(trainings: Training[]): Training[][] {
    const firstTraining = trainings[0];
    const lastTraining = trainings[trainings.length - 1];

    const startWeek = this.common.date.getIsoWeek(firstTraining.from);
    const lastWeek = this.common.date.getIsoWeek(lastTraining.from);
    const numWeeks = lastWeek - startWeek + 1;

    const weeks = Array.from({ length: numWeeks }, () => [] as Training[]);

    // fill the trainings in weeks
    for (const training of trainings) {
      const weekIndex = this.common.date.getIsoWeek(training.from) - startWeek;

      if (weekIndex >= 0 && weekIndex < weeks.length)
        weeks[weekIndex].push(training);
    }

    // sort trainings in week by date
    for (const week of weeks)
      week.sort((a, b) => a.from.getTime() - b.from.getTime());

    const numTrainingInWeeks = weeks.flat().length;
    if (trainings.length !== numTrainingInWeeks)
      throw new BadRequestException('Some trainings are missing or not found');

    return weeks;
  }

  /**
   * For example, training exercise can have 3 sets of the following param values:
   *   - vol1L (reps) = 10, int1L (kg) = 50, vol1R (reps) = 8, int1R (kg) = 60
   *   - vol1L (reps) = 12, int1L (kg) = 55, vol1R (reps) = 10, int1R (kg) = 65
   *   - vol1L (reps) = 14, int1L (kg) = 60, vol1R (reps) = 12, int1R (kg) = 70
   *
   * Those are all unique set values for the exercise, which are returned by this method.
   */
  private getBaseSetValues(baseExercise: TrainingExercise) {
    return baseExercise.sets.map((s, setIndex) => {
      const loadField = !this.common.object.isEmpty(s.loadKg)
        ? 'loadKg'
        : !this.common.object.isEmpty(s.loadBw)
          ? 'loadBw'
          : !this.common.object.isEmpty(s.loadRm)
            ? 'loadRm'
            : undefined;

      const loadFieldR =
        loadField === 'loadRm'
          ? 'loadRmR'
          : loadField === 'loadBw'
            ? 'loadBwR'
            : 'loadKgR';

      const volField = !this.common.object.isEmpty(s.reps)
        ? 'reps'
        : !this.common.object.isEmpty(s.time)
          ? 'time'
          : !this.common.object.isEmpty(s.dist)
            ? 'dist'
            : undefined;

      const volFieldR =
        volField === 'reps' ? 'repsR' : volField === 'time' ? 'time' : 'dist';

      return {
        setIndex,
        baseIntL: s[loadField] ? +s[loadField] : undefined,
        baseVolL: s[volField] ? +s[volField] : undefined,
        baseIntR: s[loadFieldR] ? +s[loadFieldR] : undefined,
        baseVolR: s[volFieldR] ? +s[volFieldR] : undefined,
      };
    });
  }

  private getIntParamValue(
    lr: 'L' | 'R',
    set: ExerciseSet,
  ): { field: ExerciseParamField; value: number } | undefined {
    const loadFieldL: ExerciseParamField = !this.common.object.isEmpty(
      set.loadKg,
    )
      ? 'loadKg'
      : !this.common.object.isEmpty(set.loadBw)
        ? 'loadBw'
        : !this.common.object.isEmpty(set.loadRm)
          ? 'loadRm'
          : undefined;

    const loadFieldR: ExerciseParamField = !this.common.object.isEmpty(
      set.loadKgR,
    )
      ? 'loadKgR'
      : !this.common.object.isEmpty(set.loadBwR)
        ? 'loadBwR'
        : !this.common.object.isEmpty(set.loadRmR)
          ? 'loadRmR'
          : undefined;

    if (!loadFieldL || !loadFieldR) return undefined;

    return {
      field: lr === 'L' ? loadFieldL : loadFieldR,
      value: +(set[lr === 'L' ? loadFieldL : loadFieldR] || 0),
    };
  }

  private getVolParamValue(
    lr: 'L' | 'R',
    set: ExerciseSet,
  ): { field: ExerciseParamField; value: number } | undefined {
    const volFieldL = !this.common.object.isEmpty(set.reps)
      ? 'reps'
      : !this.common.object.isEmpty(set.time)
        ? 'time'
        : !this.common.object.isEmpty(set.dist)
          ? 'dist'
          : undefined;

    const volFieldR = !this.common.object.isEmpty(set.repsR)
      ? 'repsR'
      : !this.common.object.isEmpty(set.time)
        ? 'time'
        : !this.common.object.isEmpty(set.dist)
          ? 'dist'
          : undefined;

    if (!volFieldL || !volFieldR) return undefined;

    return {
      field: lr === 'L' ? volFieldL : volFieldR,
      value: +(set[lr === 'L' ? volFieldL : volFieldR] || 0),
    };
  }

  private isSubgroup(item: TrainingComponent | Subgroup): item is Subgroup {
    return (item as Subgroup).name !== undefined;
  }
}
