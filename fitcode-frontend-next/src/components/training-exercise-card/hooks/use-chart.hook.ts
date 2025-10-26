import { useEffect, useState } from 'react';

import { DEFAULT_CHART_PARAMS } from '../chart';
import { getAthleteChart, getGroupChart } from '../chart.util';
import { core } from '@/core/core.service';
import type { ChartWorkloadData } from '@/core/training/type/chart-workload-data.type';
import type { ExerciseParamField } from '@/core/training/type/exercise-set.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { Dimensions } from '@/lib/common/type/dimensions.type';
import { useGroup } from '@/store/group.provider';
import { useSupersets } from '@/store/supersets.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import dayjs from 'dayjs';

interface Props {
  exercise: TrainingExercise;
}

export type TrainingExerciseChartCtx = ReturnType<
  typeof useTrainingExerciseCardChart
>;

export default function useTrainingExerciseCardChart({ exercise }: Props) {
  const groupContext = useGroup();
  const trainerDayViewContext = useTrainerDayView();
  const supersetsContext = useSupersets();
  const { trainings } = groupContext;
  const { selectedExercise } = supersetsContext;

  const {
    training,
    selectedAthlete,
    selectedAthleteCompletedWorkloads: selectedAthleteWorkloads,
    component,
  } = trainerDayViewContext;

  const [selectedParams, setSelectedParams] =
    useState<ExerciseParamField[]>(DEFAULT_CHART_PARAMS);

  const [chartData, setChartData] = useState<ChartWorkloadData[]>([]);
  const [max, setMax] = useState<number>(10);
  const [range, setRange] = useState<number[]>([1, 6]); // Example range

  const [percentageForChartBackground, setPercentageForChartBackground] =
    useState<number>(0);

  const [paddingForChartBackground, setPaddingForChartBackground] =
    useState<Dimensions>({ width: 0, height: 0 });

  // useEffect to init avg workloads for chart
  useEffect(() => {
    if (exercise.id !== selectedExercise?.id || !training || !component) return;

    const chartData = !selectedAthlete
      ? getGroupChart(exercise, component, training, {
          trainings: trainings.map((t) =>
            t.id === training.id ? training : t
          ),
          selectedParams,
        })
      : getAthleteChart(
          selectedAthlete.uid,
          exercise,
          component,
          core.training.getAthleteTraining(selectedAthlete.uid, training),
          {
            trainings: trainings.map((t) =>
              t.id === training.id ? training : t
            ),
            workloads: selectedAthleteWorkloads,
            subgroup: trainerDayViewContext.selectedSubgroup,
            selectedParams,
          }
        );

    setChartData(chartData);
    setMax(chartData.length);
    setRange([1, chartData.length]);
  }, [selectedAthleteWorkloads, trainings, selectedParams]);

  useEffect(() => {
    // Set the percentage for the chart background (completed vs future) based on the range
    if (exercise.id !== selectedExercise?.id) return;

    const newDataInRange = chartData.slice(range[0] - 1, range[1]);
    const todayIndex = newDataInRange.findIndex(
      (d) => d.trainingId === training?.id
    );

    console.log('todayIndex', todayIndex, newDataInRange.length);

    if (todayIndex === -1 || newDataInRange.length < 2) return;

    const percentage = (todayIndex / (newDataInRange.length - 1)) * 100;

    console.log('percentage', percentage);
    setPercentageForChartBackground(percentage);
  }, [range]);

  useEffect(() => {
    // Sets the padding for the chart background based on the percentage
    const observer = new MutationObserver(() => {
      const graphDotsElement = document.querySelector('.recharts-line-dots');
      const xAxisElement = document.querySelector('.recharts-xAxis');
      const rechartsSurfaceElement =
        document.querySelector('.recharts-surface');

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

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [window.innerWidth]);

  return {
    chartData,
    setChartData,
    selectedParams,
    setSelectedParams,
    percentageForChartBackground,
    setPercentageForChartBackground,
    paddingForChartBackground,
    setPaddingForChartBackground,
    max,
    setMax,
    range,
    setRange,
  };
}
