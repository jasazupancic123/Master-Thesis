import { useEffect, useState } from 'react';

import { getAthleteChart, getGroupChart } from '../chart.util';
import { app } from '@/core/app.service';
import type { ChartWorkloadData } from '@/core/training/type/chart-workload-data.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type { Dimensions } from '@/lib/common/type/dimensions.type';
import { useGroup } from '@/store/group.provider';
import { useSupersets } from '@/store/supersets.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

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
      ? getGroupChart(exercise, component, training, { trainings })
      : getAthleteChart(
          selectedAthlete.uid,
          exercise,
          component,
          app.training.getAthleteTraining(selectedAthlete.uid, training),
          {
            trainings,
            workloads: selectedAthleteWorkloads,
            subgroup: trainerDayViewContext.selectedSubgroup,
          }
        );

    setChartData(chartData);
    setMax(chartData.length);
    setRange([1, chartData.length]);
  }, [selectedAthleteWorkloads, trainings]);

  useEffect(() => {
    // Set the percentage for the chart background (completed vs future) based on the range
    if (exercise.id !== selectedExercise?.id) return;

    const newDataInRange = chartData.slice(range[0] - 1, range[1]);
    const todayIndex = newDataInRange.findIndex(
      (d) => d.trainingId === training?.id
    );

    if (todayIndex === -1 || newDataInRange.length < 2) return;

    const percentage = (todayIndex / (newDataInRange.length - 1)) * 100;
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
