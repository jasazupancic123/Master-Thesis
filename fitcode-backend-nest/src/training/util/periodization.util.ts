import { ParamType } from 'src/component/enum/param.enum';
import { Training } from '../entity/training.entity';
import { PeriodizationType } from 'src/group/enum/periodization-type.enum';
import { start } from 'repl';

export class PeriodizationUtil {
  static periodize(
    baseTraining: Training,
    trainings: Training[],
    weeks: Training[][],
    componentId: string,
    exerciseIds: string[],
    periodizationType: PeriodizationType,
  ) {
    let startIntensities = [] as {
      exerciseId: string;
      leftOrRight: 'L' | 'R';
      value: number;
    }[];
    let startVolumes = [] as {
      exerciseId: string;
      leftOrRight: 'L' | 'R';
      value: number;
    }[];

    const baseComponent = baseTraining.components.find(
      (c) => c.id === componentId,
    );
    if (!baseComponent) throw new Error('Base component not found');

    const baseExercises = baseComponent.supersets.flatMap((s) => s.exercises);
    if (baseExercises.length === 0)
      throw new Error('No exercises found in the base component');

    for (const exerciseId of exerciseIds) {
      let prevIntensityL = 0;
      let prevVolumeL = 0;

      let prevIntensityR = 0;
      let prevVolumeR = 0;

      for (const week of weeks) {
        for (const training of week) {
          const component = training.components.find(
            (c) => c.id === componentId,
          );
          if (!component) continue;

          const exercises = component.supersets.flatMap((s) => s.exercises);

          const exerciseToPeriodize = exercises.find(
            (e) => e.id === exerciseId,
          );
          if (!exerciseToPeriodize) continue;

          const baseExercise = baseExercises.find((e) => e.id === exerciseId);
          if (!baseExercise) continue;

          const readinessFactor = Math.random() * 0.2 + 0.9; // Simulate readiness factor between 0.9 and 1.1
          for (const set of baseExercise.sets) {
            for (const paramValues of [set.paramValuesL, set.paramValuesR]) {
              let leftOrRight =
                paramValues === set.paramValuesL ? 'L' : ('R' as 'L' | 'R');

              const baseIntensity =
                paramValues === set.paramValuesL
                  ? set.paramValuesL.find((p) => p.field === ParamType.IntWork1)
                  : set.paramValuesR.find(
                      (p) => p.field === ParamType.IntWork1,
                    );

              const baseVolume =
                paramValues === set.paramValuesL
                  ? set.paramValuesL.find((p) => p.field === ParamType.VolWork1)
                  : set.paramValuesR.find(
                      (p) => p.field === ParamType.VolWork1,
                    );

              if (!baseIntensity || !baseVolume) continue;

              let startIntensity = startIntensities.find(
                (e) =>
                  e.exerciseId === exerciseId && e.leftOrRight === leftOrRight,
              );

              let startVolume = startVolumes.find(
                (e) =>
                  e.exerciseId === exerciseId && e.leftOrRight === leftOrRight,
              );

              if (!startIntensity) {
                startIntensity = {
                  exerciseId,
                  value: parseFloat(baseIntensity.value),
                  leftOrRight,
                };
                startIntensities.push(startIntensity);
              }

              if (!startVolume) {
                startVolume = {
                  exerciseId,
                  value: parseFloat(baseVolume.value),
                  leftOrRight,
                };
                startVolumes.push(startVolume);
              }

              const periodizedIntesity =
                paramValues === set.paramValuesL
                  ? exerciseToPeriodize.sets[
                      baseExercise.sets.indexOf(set)
                    ].paramValuesL.find((p) => p.field === ParamType.IntWork1)
                  : exerciseToPeriodize.sets[
                      baseExercise.sets.indexOf(set)
                    ].paramValuesR.find((p) => p.field === ParamType.IntWork1);

              const periodizedVolume =
                paramValues === set.paramValuesL
                  ? exerciseToPeriodize.sets[
                      baseExercise.sets.indexOf(set)
                    ].paramValuesL.find((p) => p.field === ParamType.VolWork1)
                  : exerciseToPeriodize.sets[
                      baseExercise.sets.indexOf(set)
                    ].paramValuesR.find((p) => p.field === ParamType.VolWork1);

              if (!periodizedIntesity || !periodizedVolume) continue;

              const { periodizedIntensityValue, periodizedVolumeValue } =
                this.getPeriodizedIntVolValue(
                  periodizationType,
                  parseFloat(baseIntensity.value),
                  weeks.indexOf(week),
                  week.indexOf(training),
                  startIntensity.value,
                  startVolume.value,
                  leftOrRight === 'L' ? prevIntensityL : prevIntensityR,
                  leftOrRight === 'L' ? prevVolumeL : prevVolumeR,
                  weeks.length,
                  readinessFactor,
                );

              periodizedIntesity.value = periodizedIntensityValue;
              periodizedVolume.value = periodizedVolumeValue;

              if (
                baseExercise.sets.indexOf(set) ===
                baseExercise.sets.length - 1
              ) {
                if (leftOrRight === 'L') {
                  prevIntensityL = parseFloat(periodizedIntensityValue);
                  prevVolumeL = parseFloat(periodizedVolumeValue);
                } else if (leftOrRight === 'R') {
                  prevIntensityR = parseFloat(periodizedIntensityValue);
                  prevVolumeR = parseFloat(periodizedVolumeValue);
                }
              }
            }
          }
        }
      }
    }

    return trainings;
  }

  static dupSchedule = {
    1: {
      // Week 1
      1: { sets: 4, rep_range: '10-12', int_low: 0.67, int_high: 0.75 },
      2: { sets: 4, rep_range: '8-10', int_low: 0.75, int_high: 0.8 },
      3: { sets: 4, rep_range: '6-8', int_low: 0.8, int_high: 0.85 },
    },
    2: {
      // Week 2
      1: { sets: 4, rep_range: '10-12', int_low: 0.75, int_high: 0.8 },
      2: { sets: 4, rep_range: '8-10', int_low: 0.8, int_high: 0.85 },
      3: { sets: 4, rep_range: '4-6', int_low: 0.85, int_high: 0.9 },
    },
    3: {
      // Week 3
      1: { sets: 4, rep_range: '10-12', int_low: 0.8, int_high: 0.85 },
      2: { sets: 4, rep_range: '6-8', int_low: 0.85, int_high: 0.9 },
      3: { sets: 4, rep_range: '4-6', int_low: 0.9, int_high: 0.95 },
    },
    4: {
      // Week 4
      1: { sets: 4, rep_range: '2-4', int_low: 0.9, int_high: 0.95 },
      2: { sets: 4, rep_range: '4-6', int_low: 0.8, int_high: 0.85 },
      3: { sets: 4, rep_range: '6-8', int_low: 0.65, int_high: 0.67 },
    },
  };

  private static getPeriodizedIntVolValue(
    type: PeriodizationType,
    baseValue: number,
    weekIndex: number,
    dayIndex: number,
    startIntensityValue: number,
    startVolumeValue: number,
    prevIntensityValue: number,
    prevVolumeValue: number,
    weeksLength: number,
    readinessFactor: number,
  ) {
    switch (type) {
      case PeriodizationType.LINEAR: {
        if (
          (weekIndex === 0 && dayIndex === 0) ||
          (!prevIntensityValue && !prevVolumeValue)
        ) {
          return {
            periodizedIntensityValue: startIntensityValue.toString(),
            periodizedVolumeValue: startVolumeValue.toString(),
          };
        }

        const maxWeeklyIncrease = 0.05 * startIntensityValue; // Max 5% increase per week
        const maxMonthlyIncrease = 0.2 * startIntensityValue; // Max 20% increase per month
        const increase = Math.min(maxWeeklyIncrease, maxMonthlyIncrease / 4);

        const periodizedIntensityValue = this.customRoundIntensity(
          prevIntensityValue + increase,
          startIntensityValue,
        ).toString();

        const periodizedVolumeValue =
          prevVolumeValue - 1 > 3 // Ensure volume does not go below 3
            ? (prevVolumeValue - 1).toString()
            : '3';

        return {
          periodizedIntensityValue,
          periodizedVolumeValue,
        };
      }
      case PeriodizationType.WEEK_UNDULATING: {
        if (weekIndex === 0) {
          return {
            periodizedIntensityValue: startIntensityValue.toString(),
            periodizedVolumeValue: startVolumeValue.toString(),
          };
        }

        const delta = 0.05 * weekIndex;

        if (weekIndex % 2 === 0) {
          const periodizedIntensityValue = this.customRoundIntensity(
            startIntensityValue * (1 - delta),
            startIntensityValue,
          ).toString();

          const periodizedVolumeValue = Math.round(
            startVolumeValue * (1 + delta),
          ).toString();

          return { periodizedIntensityValue, periodizedVolumeValue };
        } else {
          const periodizedIntensityValue = this.customRoundIntensity(
            startIntensityValue * (1 + delta),
            startIntensityValue,
          ).toString();

          const periodizedVolumeValue = Math.round(
            startVolumeValue * (1 - delta),
          ).toString();
          return { periodizedIntensityValue, periodizedVolumeValue };
        }
      }
      case PeriodizationType.DAY_UNDULATING: {
        if (weekIndex === 0 && dayIndex === 0) {
          return {
            periodizedIntensityValue: startIntensityValue.toString(),
            periodizedVolumeValue: startVolumeValue.toString(),
          };
        }

        const delta = 0.05 * dayIndex;

        if (dayIndex % 2 === 1) {
          const periodizedIntensityValue = this.customRoundIntensity(
            startIntensityValue * (1 + delta),
            startIntensityValue,
          ).toString();

          const periodizedVolumeValue = Math.round(
            startVolumeValue * (1 - delta),
          ).toString();

          return { periodizedIntensityValue, periodizedVolumeValue };
        } else {
          const periodizedIntensityValue = this.customRoundIntensity(
            startIntensityValue * (1 - delta),
            startIntensityValue,
          ).toString();

          const periodizedVolumeValue = Math.round(
            startVolumeValue * (1 + delta),
          ).toString();
          return { periodizedIntensityValue, periodizedVolumeValue };
        }
      }
      case PeriodizationType.BLOCK: {
        let intensityMultiplier = 1.0;
        let periodizedVolumeValue = '';

        const portion = (1.0 * (weekIndex + 1)) / (1.0 * weeksLength);

        if (portion <= 0.4) {
          intensityMultiplier = 0.65;
          periodizedVolumeValue = '8';
        } else if (portion <= 0.7) {
          intensityMultiplier = 0.8;
          periodizedVolumeValue = '5';
        } else {
          intensityMultiplier = 0.9;
          periodizedVolumeValue = '3';
        }

        const periodizedIntensityValue = this.customRoundIntensity(
          startIntensityValue * intensityMultiplier,
          startIntensityValue,
        ).toString();

        return { periodizedIntensityValue, periodizedVolumeValue };
      }
      case PeriodizationType.WAVE: {
        const wavePattern = [0.75, 0.85, 0.8, 0.9];
        const fraction = wavePattern[weekIndex % 4];

        const periodizedIntensityValue = this.customRoundIntensity(
          startIntensityValue * fraction,
          startIntensityValue,
        ).toString();

        const periodizedVolumeValue = fraction < 0.85 ? '5' : '3';

        return { periodizedIntensityValue, periodizedVolumeValue };
      }
      case PeriodizationType.AUTOREGULATORY: {
        if (weekIndex === 0 && dayIndex === 0) {
          return {
            periodizedIntensityValue: startIntensityValue.toString(),
            periodizedVolumeValue: startVolumeValue.toString(),
          };
        }

        const periodizedIntensityValue = this.customRoundIntensity(
          prevIntensityValue * readinessFactor,
          startIntensityValue,
        ).toString();

        const reps = Math.round(prevVolumeValue * readinessFactor);

        const periodizedVolumeValue = Math.max(reps, 3).toString(); // Ensure volume does not go below 3

        return { periodizedIntensityValue, periodizedVolumeValue };
      }
      case PeriodizationType.DUP_TABLE_BASED: {
        const weekMod = (weekIndex % 4) + 1;
        const dayMod = Math.min(dayIndex + 1, 3);

        const dayInfo = this.dupSchedule[weekMod][dayMod];

        const intLow = dayInfo.int_low;
        const intHigh = dayInfo.int_high;
        const fraction = (intLow + intHigh) / 2.0;

        const periodizedIntensityValue = this.customRoundIntensity(
          startIntensityValue * fraction,
          startIntensityValue,
        ).toString();

        const periodizedVolumeValue = dayInfo.rep_range;

        return { periodizedIntensityValue, periodizedVolumeValue };
      }
      default: {
        throw new Error(`Periodization type ${type} is not implemented`);
      }
    }
  }

  private static customRoundIntensity(weight: number, baseline: number) {
    /*
    Rounds the 'weight' according to these rules:
    
    1) If baseline < 20 => all final weights are rounded
       to the nearest integer (1 kg steps).
    
    Otherwise:
      a) If weight <= 10, round to the nearest integer.
      b) If 10 < weight <= 40, round to the nearest even number (>=12, <=40).
      c) If weight > 40, round to the nearest multiple of 5.
    */

    // If the user's starting entry was < 20 kg, do simple integer rounding.
    if (baseline < 20) return Math.round(weight);

    // Otherwise, follow the older logic:
    if (weight <= 10) {
      // Round normally to an integer
      return Math.round(weight);
    } else if (weight <= 40) {
      // Round to the nearest multiple of 2
      let evenApprox = Math.round(weight / 2) * 2;

      // Clamp between 12 and 40
      if (evenApprox < 12) {
        evenApprox = 12;
      } else if (evenApprox > 40) {
        evenApprox = 40;
      }
      return evenApprox;
    } else {
      // Above 40 => round to nearest multiple of 5
      return Math.round(weight / 5) * 5;
    }
  }
}
