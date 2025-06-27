'use client';

import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import {
  Superset,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import TrainingExerciseCard from '../training-exercise-card/training-exercise-card';
import { useGroup } from '@/store/group-provider';
import { ChartWorkloadData } from '@/controller/training/type/chart-workload-data.type';
import {
  prepareSelectedAthleteAvgWorkloadsForChart,
  prepareGroupAvgWorkloadsForChart,
} from '../trainer-day-view/state';
import { isBefore } from 'date-fns';
import { Dimensions } from '@/common/type/dimensions.type';
import TrainignExerciseSelected from '../training-exercise-selected/training-exercise-selected';
import { SetState } from '@/common/type/state.type';

interface TrainingExerciseCardContainerProps {
  supersetIndex: number;
  exercise: TrainingExercise;
  selectedExercise: TrainingExercise | null;
  setSelectedExercise: Dispatch<SetStateAction<TrainingExercise | null>>;
  onAthleteView?: boolean;
  superior?: { row: boolean; column: boolean; all: boolean };
  setOpenVideoPlayerModal: Dispatch<SetStateAction<boolean>>;
  supersets: Superset[];
  setSupersets: SetState<Superset[]>;
  setsNumbers: { exerciseId: string; setsNumber: number }[];
  setSetsNumbers: SetState<{ exerciseId: string; setsNumber: number }[]>;
  expandedExercisesView: boolean;
  setExpandedExercisesView: SetState<boolean>;
}

export default function TrainingExerciseCardContainer(
  props: TrainingExerciseCardContainerProps
) {
  const {
    training,
    selectedAthlete,
    selectedAthleteWorkloads,
    component,
    selectedSubgroup,
  } = useTrainerDayViewContext();
  const { trainings } = useGroup();

  const {
    supersetIndex,
    exercise,
    selectedExercise,
    setSelectedExercise,
    superior,
    setOpenVideoPlayerModal,
    supersets,
    setSupersets,
    onAthleteView,
    setsNumbers,
    setSetsNumbers,
    expandedExercisesView,
    setExpandedExercisesView,
  } = props;

  const [data, setData] = useState<ChartWorkloadData[]>([]);
  const [percentageForChartBackground, setPercentageForChartBackground] =
    useState<number>(0);
  const [paddingForChartBackground, setPaddingForChartBackground] =
    useState<Dimensions>({ width: 0, height: 0 });

  const [range, setRange] = useState<number[]>([1, 6]); // Example range
  const [max, setMax] = useState<number>(10);

  useEffect(() => {
    const newSetsNumbers = [] as { exerciseId: string; setsNumber: number }[];

    if (selectedSubgroup?.subgroup) {
      selectedSubgroup.subgroup.supersets.forEach((superset) => {
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
        superset.exercises.forEach((exercise) => {
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

    setSetsNumbers(newSetsNumbers);
  }, [selectedSubgroup?.subgroup]);
  // }, [selectedSubgroup?.subgroup, training, component]);

  useEffect(() => {
    if (exercise.id !== selectedExercise?.id || !training) return;
    // useEffect to init avg workloads
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

    const numberOfCompletedWorkloads = newDataInRange.filter((workload) =>
      isBefore(workload.plannedAt, new Date())
    ).length;

    const numberOfTotalWorkloads = newDataInRange.length;

    let percentage;
    if (newDataInRange.length === 1) {
      percentage = newDataInRange[0].completed ? 100 : 0;
    } else if (
      newDataInRange.length === 2 &&
      newDataInRange[0].completed &&
      !newDataInRange[1].completed
    ) {
      percentage = 50;
    } else {
      percentage =
        0.5 + // 0.5% offset so that the last completed one is also in dark background
        ((numberOfCompletedWorkloads - 1) / (numberOfTotalWorkloads - 1)) * 100;
    }
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
      selectedExercise={selectedExercise}
      setSelectedExercise={setSelectedExercise}
      supersets={supersets}
      range={range}
      setRange={setRange}
      setOpenVideoPlayerModal={setOpenVideoPlayerModal}
      paddingForChartBackground={paddingForChartBackground}
      percentageForChartBackground={percentageForChartBackground}
      max={max}
      data={data}
      onAthleteView={onAthleteView}
      superior={superior}
      setsNumbers={setsNumbers}
      setSetsNumbers={setSetsNumbers}
      setSupersets={setSupersets}
      expandedExercisesView={expandedExercisesView}
      setExpandedExercisesView={setExpandedExercisesView}
    />
  ) : (
    <TrainingExerciseCard
      supersetIndex={supersetIndex}
      exercise={exercise}
      selectedExercise={selectedExercise}
      setSelectedExercise={setSelectedExercise}
      superior={superior}
      setOpenVideoPlayerModal={setOpenVideoPlayerModal}
      setsNumbers={setsNumbers}
      setSetsNumbers={setSetsNumbers}
      setSupersets={setSupersets}
      expandedExercisesView={expandedExercisesView}
      setExpandedExercisesView={setExpandedExercisesView}
    />
  );
}
