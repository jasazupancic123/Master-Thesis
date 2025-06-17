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

    let startInts: { exerciseId: string; value: number }[] = [];
    let startVols: { exerciseId: string; value: number }[] = [];

    for (const exerciseId of exerciseIds) {
      let prevInt = 0;
      let prevVol = 0;

      for (const week of weeks) {
        for (const training of week) {
          const component = training.components.find(
            (c) => c.id === componentId,
          );

          if (!component) continue;

          // get exercises to periodize
          const exercises = component.supersets
            .flatMap((s) => s.exercises)
            .find((e) => e.id === exerciseId);

          if (!exercises) continue;

          const exercise = baseExercises.find((e) => e.id === exerciseId);
          if (!exercise) continue;

          const readinessFactor = Math.random() * 0.2 + 0.9; // Simulate readiness factor between 0.9 and 1.1
          for (const set of exercise.sets) {
            const baseInt = set.paramValuesL.find(
              (p) => p.field === ParamType.IntWork1,
            );

            const baseVol = set.paramValuesL.find(
              (p) => p.field === ParamType.VolWork1,
            );

            if (!baseInt || !baseVol) continue;

            let startInt = startInts.find((e) => e.exerciseId === exerciseId);
            let startVol = startVols.find((e) => e.exerciseId === exerciseId);

            if (!startInt) {
              startInt = { exerciseId, value: parseFloat(baseInt.value) };
              startInts.push(startInt);
            }

            if (!startVol) {
              startVol = { exerciseId, value: parseFloat(baseVol.value) };
              startVols.push(startVol);
            }

            const periodizedInt = exercises.sets[
              exercise.sets.indexOf(set)
            ].paramValuesL.find((p) => p.field === ParamType.IntWork1);

            const periodizedVol = exercises.sets[
              exercise.sets.indexOf(set)
            ].paramValuesL.find((p) => p.field === ParamType.VolWork1);

            if (!periodizedInt || !periodizedVol) continue;
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

            if (exercise.sets.indexOf(set) === exercise.sets.length - 1) {
              prevInt = parseFloat(periodizedIntensityValue);
              prevVol = parseFloat(periodizedVolumeValue);
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
      throw new Error('No exercises found in the base component');

    return exercises;
  }

  private getPeriodizedIntVolValue(
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
        return this.linear(
          startIntensityValue,
          startVolumeValue,
          weekIndex,
          dayIndex,
          prevIntensityValue,
          prevVolumeValue,
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
          prevIntensityValue,
          prevVolumeValue,
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
