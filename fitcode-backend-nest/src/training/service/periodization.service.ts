import { ParamType } from '../../component/enum/param.enum';
import { Training } from '../entity/training.entity';
import { PeriodizationType } from '../../group/enum/periodization-type.enum';
import { BadRequestException } from '@nestjs/common';
import { DUP_SCHEDULE } from '../constant/periodization.constant';

export class PeriodizationService {
  periodize(
    baseTraining: Training,
    trainings: Training[],
    weeks: Training[][],
    componentId: string,
    exerciseIds: string[],
    periodizationType: PeriodizationType,
  ) {
    const baseExercises = this.getExercisesOrFail(baseTraining, componentId);

    for (const exerciseId of exerciseIds) {
      let prevIntL = [] as { setIndex: number; value: number }[];
      let prevVolL = [] as { setIndex: number; value: number }[];

      let prevIntR = [] as { setIndex: number; value: number }[];
      let prevVolR = [] as { setIndex: number; value: number }[];

      for (const week of weeks) {
        for (const training of week) {
          const component = training.components.find(
            (c) => c.id === componentId,
          );

          if (!component) continue;

          // get exercises to periodize
          const exerciseToPeriodize = component.supersets
            .flatMap((s) => s.exercises)
            .find((e) => e.id === exerciseId);

          if (!exerciseToPeriodize) continue;

          const baseExercise = baseExercises.find((e) => e.id === exerciseId);
          if (!baseExercise) continue;

          // if (
          //   baseExercise.sets.length > 0 &&
          //   !prevIntL.length &&
          //   !prevIntR.length &&
          //   !prevVolL.length &&
          //   !prevVolR.length
          // ) {
          //   prevIntL.push({
          //     setIndex: 0,
          //     value: parseFloat(
          //       baseExercise.sets[0].paramValuesL.find(
          //         (p) => p.field === ParamType.IntWork1,
          //       )?.value || '0',
          //     ),
          //   });
          //   prevVolL.push({
          //     setIndex: 0,
          //     value: parseFloat(
          //       baseExercise.sets[0].paramValuesL.find(
          //         (p) => p.field === ParamType.VolWork1,
          //       )?.value || '0',
          //     ),
          //   });
          //   prevIntR.push({
          //     setIndex: 0,
          //     value: parseFloat(
          //       baseExercise.sets[0].paramValuesR.find(
          //         (p) => p.field === ParamType.IntWork1,
          //       )?.value || '0',
          //     ),
          //   });
          //   prevVolR.push({
          //     setIndex: 0,
          //     value: parseFloat(
          //       baseExercise.sets[0].paramValuesR.find(
          //         (p) => p.field === ParamType.VolWork1,
          //       )?.value || '0',
          //     ),
          //   });
          // }

          let startInts: {
            exerciseId: string;
            leftOrRight: 'L' | 'R';
            value: number;
          }[] = [];
          let startVols: {
            exerciseId: string;
            leftOrRight: 'L' | 'R';
            value: number;
          }[] = [];

          const readinessFactor = Math.random() * 0.2 + 0.9; // Simulate readiness factor between 0.9 and 1.1
          for (const set of baseExercise.sets) {
            for (const paramValues of [set.paramValuesL, set.paramValuesR]) {
              let leftOrRight =
                paramValues === set.paramValuesL ? 'L' : ('R' as 'L' | 'R');

              const baseInt =
                paramValues === set.paramValuesL
                  ? set.paramValuesL.find((p) => p.field === ParamType.IntWork1)
                  : set.paramValuesR.find(
                      (p) => p.field === ParamType.IntWork1,
                    );

              const baseVol =
                paramValues === set.paramValuesL
                  ? set.paramValuesL.find((p) => p.field === ParamType.VolWork1)
                  : set.paramValuesR.find(
                      (p) => p.field === ParamType.VolWork1,
                    );

              if (!baseInt || !baseVol) continue;

              let startInt = startInts.find(
                (e) =>
                  e.exerciseId === exerciseId && e.leftOrRight === leftOrRight,
              );

              let startVol = startVols.find(
                (e) =>
                  e.exerciseId === exerciseId && e.leftOrRight === leftOrRight,
              );

              if (!startInt) {
                startInt = {
                  exerciseId,
                  value: parseFloat(baseInt.value),
                  leftOrRight,
                };
                startInts.push(startInt);
              } else if (startInt.value !== parseFloat(baseInt.value))
                startInt.value = parseFloat(baseInt.value);

              if (!startVol) {
                startVol = {
                  exerciseId,
                  value: parseFloat(baseVol.value),
                  leftOrRight,
                };
                startVols.push(startVol);
              } else if (startVol.value !== parseFloat(baseVol.value))
                startVol.value = parseFloat(baseVol.value);

              const periodizedInt =
                paramValues === set.paramValuesL
                  ? exerciseToPeriodize.sets[
                      baseExercise.sets.indexOf(set)
                    ].paramValuesL.find((p) => p.field === ParamType.IntWork1)
                  : exerciseToPeriodize.sets[
                      baseExercise.sets.indexOf(set)
                    ].paramValuesR.find((p) => p.field === ParamType.IntWork1);

              const periodizedVol =
                paramValues === set.paramValuesL
                  ? exerciseToPeriodize.sets[
                      baseExercise.sets.indexOf(set)
                    ].paramValuesL.find((p) => p.field === ParamType.VolWork1)
                  : exerciseToPeriodize.sets[
                      baseExercise.sets.indexOf(set)
                    ].paramValuesR.find((p) => p.field === ParamType.VolWork1);

              if (!periodizedInt || !periodizedVol) continue;

              const prevInt =
                leftOrRight === 'L'
                  ? prevIntL.find(
                      (e) => e.setIndex === baseExercise.sets.indexOf(set),
                    )?.value
                  : prevIntR.find(
                      (e) => e.setIndex === baseExercise.sets.indexOf(set),
                    )?.value;

              const prevVol =
                leftOrRight === 'L'
                  ? prevVolL.find(
                      (e) => e.setIndex === baseExercise.sets.indexOf(set),
                    )?.value
                  : prevVolR.find(
                      (e) => e.setIndex === baseExercise.sets.indexOf(set),
                    )?.value;

              const { periodizedIntensityValue, periodizedVolumeValue } =
                this.getPeriodizedIntVolValue(
                  periodizationType,
                  parseFloat(baseInt.value),
                  weeks.indexOf(week),
                  week.indexOf(training),
                  startInt.value,
                  startVol.value,
                  prevInt,
                  prevVol,
                  weeks.length,
                  readinessFactor,
                );

              periodizedInt.value = periodizedIntensityValue;
              periodizedVol.value = periodizedVolumeValue;

              if (leftOrRight === 'L') {
                const foundPrevIntL = prevIntL.find(
                  (e) => e.setIndex === baseExercise.sets.indexOf(set),
                );
                if (foundPrevIntL)
                  foundPrevIntL.value = parseFloat(periodizedIntensityValue);
                else {
                  prevIntL.push({
                    setIndex: baseExercise.sets.indexOf(set),
                    value: parseFloat(periodizedIntensityValue),
                  });
                }

                const foundPrevVolL = prevVolL.find(
                  (e) => e.setIndex === baseExercise.sets.indexOf(set),
                );
                if (foundPrevVolL)
                  foundPrevVolL.value = parseFloat(periodizedVolumeValue);
                else {
                  prevVolL.push({
                    setIndex: baseExercise.sets.indexOf(set),
                    value: parseFloat(periodizedVolumeValue),
                  });
                }
              } else if (leftOrRight === 'R') {
                const foundPrevIntR = prevIntR.find(
                  (e) => e.setIndex === baseExercise.sets.indexOf(set),
                );
                if (foundPrevIntR)
                  foundPrevIntR.value = parseFloat(periodizedIntensityValue);
                else {
                  prevIntR.push({
                    setIndex: baseExercise.sets.indexOf(set),
                    value: parseFloat(periodizedIntensityValue),
                  });
                }

                const foundPrevVolR = prevVolR.find(
                  (e) => e.setIndex === baseExercise.sets.indexOf(set),
                );
                if (foundPrevVolR)
                  foundPrevVolR.value = parseFloat(periodizedVolumeValue);
                else {
                  prevVolR.push({
                    setIndex: baseExercise.sets.indexOf(set),
                    value: parseFloat(periodizedVolumeValue),
                  });
                }
              }
            }
          }
        }
      }
    }

    return trainings;
  }

  private getExercisesOrFail(training: Training, componentId: string) {
    const component = training.components.find((c) => c.id === componentId);
    if (!component) throw new BadRequestException('Base component not found');

    const exercises = component.supersets.flatMap((s) => s.exercises);
    if (exercises.length === 0)
      throw new BadRequestException('No exercises found in the base component');

    return exercises;
  }

  private getPeriodizedIntVolValue(
    type: PeriodizationType,
    baseValue: number,
    weekIndex: number,
    dayIndex: number,
    startIntensityValue: number,
    startVolumeValue: number,
    prevInt: number,
    prevVol: number,
    weeksLength: number,
    readinessFactor: number,
  ) {
    switch (type) {
      case PeriodizationType.LINEAR: {
        return this.linear(
          startIntensityValue,
          startVolumeValue,
          weekIndex,
          dayIndex,
          prevInt,
          prevVol,
        );
      }
      case PeriodizationType.WEEK_UNDULATING: {
        return this.weekUndulating(
          startIntensityValue,
          startVolumeValue,
          weekIndex,
        );
      }
      case PeriodizationType.DAY_UNDULATING: {
        return this.dayUndulating(
          startIntensityValue,
          startVolumeValue,
          weekIndex,
          dayIndex,
        );
      }
      case PeriodizationType.BLOCK: {
        return this.block(startIntensityValue, weekIndex, weeksLength);
      }
      case PeriodizationType.WAVE: {
        return this.wave(startIntensityValue, weekIndex);
      }
      case PeriodizationType.AUTOREGULATORY: {
        this.autoregulatory(
          startIntensityValue,
          startVolumeValue,
          weekIndex,
          dayIndex,
          readinessFactor,
          prevInt,
          prevVol,
        );
      }
      case PeriodizationType.DUP_TABLE_BASED: {
        this.dupTableBased(startIntensityValue, weekIndex, dayIndex);
      }
      default: {
        throw new Error(`Periodization type ${type} is not implemented`);
      }
    }
  }

  private linear(
    startIntensityValue: number,
    startVolumeValue: number,
    weekIndex: number,
    dayIndex: number,
    prevIntensityValue?: number,
    prevVolumeValue?: number,
  ) {
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

  private weekUndulating(
    startIntensityValue: number,
    startVolumeValue: number,
    weekIndex: number,
  ) {
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

  private dayUndulating(
    startIntensityValue: number,
    startVolumeValue: number,
    weekIndex: number,
    dayIndex: number,
  ) {
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

  private block(
    startIntensityValue: number,
    weekIndex: number,
    weeksLength: number,
  ) {
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

  private wave(startIntensityValue: number, weekIndex: number) {
    const wavePattern = [0.75, 0.85, 0.8, 0.9];
    const fraction = wavePattern[weekIndex % 4];

    const periodizedIntensityValue = this.customRoundIntensity(
      startIntensityValue * fraction,
      startIntensityValue,
    ).toString();

    const periodizedVolumeValue = fraction < 0.85 ? '5' : '3';

    return { periodizedIntensityValue, periodizedVolumeValue };
  }

  private autoregulatory(
    startIntensityValue: number,
    startVolumeValue: number,
    weekIndex: number,
    dayIndex: number,
    readinessFactor: number,
    prevIntensityValue?: number,
    prevVolumeValue?: number,
  ) {
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

  private dupTableBased(
    startIntensityValue: number,
    weekIndex: number,
    dayIndex: number,
  ) {
    const weekMod = (weekIndex % 4) + 1;
    const dayMod = Math.min(dayIndex + 1, 3);
    const dayInfo = DUP_SCHEDULE[weekMod][dayMod];

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

  private customRoundIntensity(weight: number, baseline: number) {
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
