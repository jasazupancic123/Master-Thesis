'use client';

import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import {
  prepareGroupAvgWorkloadsForChart,
  prepareSelectedAthleteAvgWorkloadsForChart,
} from '../trainer-day-view/state';
import TrainingExerciseCard from '../training-exercise-card/training-exercise-card';
import TrainignExerciseSelected from '../training-exercise-selected/training-exercise-selected';
import type { Dimensions } from '@/common/type/dimensions.type';
import type { ChartWorkloadData } from '@/controller/training/type/chart-workload-data.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useGroup } from '@/store/group-provider';
import { useSupersets } from '@/store/supersets-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';

interface TrainingExerciseCardContainerProps {
  supersetIndex: number;
  exercise: TrainingExercise;
  onAthleteView?: boolean;
  superior?: { row: boolean; column: boolean; all: boolean };
}

export default function TrainingExerciseCardContainer(
  props: TrainingExerciseCardContainerProps
) {
  const { selectedExercise, setsNumbers, setSetsNumbers } = useSupersets();

  const {
    day,
    training,
    selectedAthlete,
    selectedAthleteWorkloads,
    component,
    selectedSubgroup,
  } = useTrainerDayViewContext();

  const { trainings } = useGroup();

  const { supersetIndex, exercise, superior, onAthleteView } = props;

  const [data, setData] = useState<ChartWorkloadData[]>([]);
  const [percentageForChartBackground, setPercentageForChartBackground] =
    useState<number>(0);
  const [paddingForChartBackground, setPaddingForChartBackground] =
    useState<Dimensions>({ width: 0, height: 0 });

  const [range, setRange] = useState<number[]>([1, 6]); // Example range
  const [max, setMax] = useState<number>(10);

  useEffect(() => {
    const newSetsNumbers = [] as { exerciseId: string; setsNumber: number }[];

    if (selectedSubgroup) {
      selectedSubgroup.supersets.forEach((superset) => {
        superset.exercises.forEach((exercise) => {
          const setsNumber = exercise.sets.length;
          newSetsNumbers.push({
            exerciseId: exercise.id,
            setsNumber: setsNumber,
          });
        });
      });
    } else {
      component?.supersets?.forEach((superset) => {
        superset.exercises?.forEach((exercise) => {
          const setsNumber = exercise.sets.length;
          newSetsNumbers.push({
            exerciseId: exercise.id,
            setsNumber: setsNumber,
          });
        });
      });
    }

    if (
      newSetsNumbers.every((s) =>
        setsNumbers.some(
          (sn) =>
            sn.exerciseId === s.exerciseId && sn.setsNumber === s.setsNumber
        )
      )
    )
      return;

    // limit setsNumbers if method and ranges exists
    // const setsRange = component?.method?.attributes
    //   ?.map((a) => a.options?.find((o) => o.field === VolWorkSetType.Set))
    //   .find(Boolean);

    // if (!setsRange) return;

    // const { min, max } = setsRange;

    // if (min !== undefined || max !== undefined) {
    //   setSetsNumbers(() => {
    //     return newSetsNumbers.map((item) => {
    //       return {
    //         ...item,
    //         setsNumber: Math.max(
    //           min || 0,
    //           Math.min(max || 1000, item.setsNumber)
    //         ),
    //       };
    //     });
    //   });
    //   return;
    // }

    // update sets numbers if method and ranges do not exist
    setSetsNumbers(newSetsNumbers);
  }, [selectedSubgroup]);
  // }, [selectedSubgroup?.subgroup, training, component]);

  useEffect(() => {
    if (exercise.id !== selectedExercise?.id || !training) return;
    // useEffect to init avg workloads for chart
    if (selectedAthlete) {
      // use fetched data for selected athlete from api
      prepareSelectedAthleteAvgWorkloadsForChart(
        selectedAthleteWorkloads,
        exercise.id,
        setData,
        setMax,
        setRange
      );
    } else {
      // group avg is already on training
      prepareGroupAvgWorkloadsForChart(
        trainings,
        exercise.id,
        setData,
        setMax,
        setRange
      );
    }
  }, [selectedExercise, selectedAthleteWorkloads, trainings]);

  useEffect(() => {
    // Set the percentage for the chart background (completed vs future) based on the range
    if (exercise.id !== selectedExercise?.id) return;

    const newDataInRange = data.slice(range[0] - 1, range[1]);

    const todayIndex = newDataInRange.findIndex((d) =>
      dayjs(d.plannedAt).isSame(day.date, 'day')
    );

    if (todayIndex === -1 || newDataInRange.length < 2) return;

    const percentage = (todayIndex / (newDataInRange.length - 1)) * 100;

    setPercentageForChartBackground(percentage);
  }, [range]);

  useEffect(() => {
    // Sets the padding for the chart background based on the percentage
    const observer = new MutationObserver(() => {
      const graphDotsElement = document.querySelector('.recharts-line-dots');

      const rechartsSurfaceElement =
        document.querySelector('.recharts-surface');

      const xAxisElement = document.querySelector('.recharts-xAxis');

      if (graphDotsElement && rechartsSurfaceElement && xAxisElement) {
        const parentRect = rechartsSurfaceElement.getBoundingClientRect();
        const dotsRect = graphDotsElement.getBoundingClientRect();
        const xAxisRect = xAxisElement.getBoundingClientRect();

        const distanceFromLeft = dotsRect.left - parentRect.left;
        const percentageWidth = (distanceFromLeft / parentRect.width) * 100;

        const distanceFromBottom = parentRect.bottom - xAxisRect.top;
        const percentageHeight =
          (distanceFromBottom / parentRect.height) * 100 + 2; // +2% for little offset

        setPaddingForChartBackground({
          width: percentageWidth,
          height: percentageHeight,
        });
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [window.innerWidth]);

  return exercise.id === selectedExercise?.id ? (
    <TrainignExerciseSelected
      supersetIndex={supersetIndex}
      exercise={exercise}
      range={range}
      setRange={setRange}
      paddingForChartBackground={paddingForChartBackground}
      percentageForChartBackground={percentageForChartBackground}
      max={max}
      data={data}
      onAthleteView={onAthleteView}
      superior={superior}
    />
  ) : (
    <TrainingExerciseCard
      supersetIndex={supersetIndex}
      exercise={exercise}
      superior={superior}
    />
  );
}
