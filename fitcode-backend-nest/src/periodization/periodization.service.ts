import { BadRequestException, Injectable } from '@nestjs/common';

import { AttributeValue } from '@src/attribute/entity/attribute-value.entity';
import { CommonService } from '@src/common/service/common.service';
import type {
  SubgroupRef,
  TrainingComponentRef,
} from '@src/common/type/firestore.type';
import { ParamType } from '@src/component/enum/param.enum';
import { ExerciseSet } from '@src/training/entity/exercise-set.entity';
import { Subgroup } from '@src/training/entity/subgroup.entity';
import { Training } from '@src/training/entity/training.entity';
import { TrainingComponent } from '@src/training/entity/training-component.entity';
import { TrainingExercise } from '@src/training/entity/training-exercise.entity';
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

  constructor(private readonly commonService: CommonService) {
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
  ) {
    if (trainings.length <= 1) return trainings;

    const periodized: Training[] = structuredClone(trainings);
    const weeks = this.getSpacedTrainingsByWeek(periodized);
    const strategy = this.getStrategy(type);

    const baseTraining = periodized[0];
    const baseItems: (TrainingComponent | Subgroup)[] = [];
    const baseItem = this.getRefItem(baseTraining, ref);
    if (!baseItem) return periodized;
    baseItems.push(baseItem);

    // periodize all child subgroups of provided subgroup
    if (ref.subgroupId && !options?.dontPeriodizeChildSubgroups) {
      const baseComponent = this.getComponent(baseTraining, ref)!;

      for (let i = 0; i < baseComponent.subgroups.length; i++) {
        const child = baseComponent.subgroups[i];
        if (child.id !== ref.subgroupId && child.parentId === ref.subgroupId)
          baseItems.push(child);
      }
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
            const item = this.getRefItem(training, ref);
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
              const exerciseSet = exercise.sets[baseSet.setNumber - 1];

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
                  prevIntensity: prevInt.find((int) => int.i === setIndex)
                    ?.value,
                  prevVolume: prevVol.find((int) => int.i === setIndex)?.value,
                });

                const foundInt = this.getIntParamValue(lr, exerciseSet);
                const foundVol = this.getVolParamValue(lr, exerciseSet);

                if (foundInt) {
                  foundInt.value = intensity.toString();
                  updatePreviousValue(prevInt, intensity);
                }

                if (foundVol) {
                  foundVol.value = volume.toString();
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

  getAvailableSuperset(item: TrainingComponent | Subgroup): number {
    // each superset can have max 4 exercises, so find first superset with less than 4 exercises
    for (let i = 0; i < item.supersets.length; i++)
      if (item.supersets[i].exercises.length < 4) return i;

    // if all supersets are full, check if we can create a new one (max 8 supersets) and create it
    if (item.supersets.length < 8) {
      item.supersets = [...item.supersets, { exercises: [] }];
      return item.supersets.length - 1; // return index of the newly created superset
    }

    // no available superset found, do not create a new one
    return -1;
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

    const startWeek = this.commonService.date.getIsoWeek(firstTraining.from);
    const lastWeek = this.commonService.date.getIsoWeek(lastTraining.from);
    const numWeeks = lastWeek - startWeek + 1;

    const weeks = Array.from({ length: numWeeks }, () => [] as Training[]);

    // fill the trainings in weeks
    for (const training of trainings) {
      const weekIndex =
        this.commonService.date.getIsoWeek(training.from) - startWeek;

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
      const baseIntL = s.paramValuesL.find(
        (pv) => pv.field === ParamType.IntWork1,
      );

      const baseVolL = s.paramValuesL.find(
        (pv) => pv.field === ParamType.VolWork1,
      );

      const baseIntR = s.paramValuesR?.find(
        (pv) => pv.field === ParamType.IntWork1,
      );

      const baseVolR = s.paramValuesR?.find(
        (pv) => pv.field === ParamType.VolWork1,
      );

      return {
        setIndex,
        baseIntL: baseIntL ? +baseIntL.value : undefined,
        baseVolL: baseVolL ? +baseVolL.value : undefined,
        baseIntR: baseIntR ? +baseIntR.value : undefined,
        baseVolR: baseVolR ? +baseVolR.value : undefined,
      };
    });
  }

  private getParamValuesBySide(
    lr: 'L' | 'R',
    set: ExerciseSet,
  ): AttributeValue[] {
    return lr === 'L'
      ? [...set.paramValuesL]
      : set.paramValuesR
        ? [...set.paramValuesR]
        : [];
  }

  private getIntParamValue(lr: 'L' | 'R', set: ExerciseSet): AttributeValue {
    const paramValues = this.getParamValuesBySide(lr, set);
    return paramValues.find((pv) => pv.field === ParamType.IntWork1);
  }

  private getVolParamValue(lr: 'L' | 'R', set: ExerciseSet): AttributeValue {
    const paramValues = this.getParamValuesBySide(lr, set);
    return paramValues.find((pv) => pv.field === ParamType.VolWork1);
  }
}
