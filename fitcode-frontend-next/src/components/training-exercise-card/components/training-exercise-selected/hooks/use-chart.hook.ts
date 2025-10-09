import { Dimensions } from '@/common/type/dimensions.type';
import { ChartWorkloadData } from '@/controller/training/type/chart-workload-data.type';
import { useGroup } from '@/store/group.provider';
import { useSupersets } from '@/store/supersets.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';
import { useEffect, useMemo, useState } from 'react';
import { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import {
  prepareGroupAvgWorkloadsForChart,
  prepareSelectedAthleteAvgWorkloadsForChart,
} from '../actions/actions-chart';
import { isNumber } from '../actions/actions-number';
import { ParamType } from '@/controller/component/enum/param.enum';

interface UseTrainingExerciseCardChartProps {
  exercise: TrainingExercise;
}

export type UseTrainingExerciseCardChartReturnType = ReturnType<
  typeof useTrainingExerciseCardChart
>;

export default function useTrainingExerciseCardChart(
  props: UseTrainingExerciseCardChartProps
) {
  const groupContext = useGroup();
  const trainerDayViewContext = useTrainerDayViewContext();
  const supersetsContext = useSupersets();

  const { trainings } = groupContext;

  const {
    training,
    selectedAthlete,
    selectedAthleteCompletedWorkloads: selectedAthleteWorkloads,
    component,
  } = trainerDayViewContext;

  const { selectedExercise } = supersetsContext;

  const { exercise } = props;

  const [chartData, setChartData] = useState<ChartWorkloadData[]>([]);
  const [percentageForChartBackground, setPercentageForChartBackground] =
    useState<number>(0);
  const [paddingForChartBackground, setPaddingForChartBackground] =
    useState<Dimensions>({ width: 0, height: 0 });
  const [max, setMax] = useState<number>(10);
  const [range, setRange] = useState<number[]>([1, 6]); // Example range
  const [selectedParams, setSelectedParams] = useState<ParamType[]>([]);

  // build the object you previously tried to get via recursive hook call
  const chartContext = useMemo(() => {
    return {
      chartData,
      setChartData,
      max,
      setMax,
      range,
      setRange,
      selectedParams,
      setSelectedParams,
      percentageForChartBackground,
      setPercentageForChartBackground,
      paddingForChartBackground,
      setPaddingForChartBackground,
      // add anything else your prepare* helpers expect on useChart
    };
  }, [chartData, max, range, selectedParams]);

  useEffect(() => {
    if (!selectedExercise) return;

    const numberParams = selectedExercise.params.filter((p) =>
      isNumber(
        selectedExercise,
        p.field as ParamType,
        exercise.sets[0].paramValuesL
      )
    );

    setSelectedParams(numberParams.map((p) => p.field as ParamType) || []);
  }, [selectedExercise]);

  // useEffect to init avg workloads for chart
  useEffect(() => {
    if (exercise.id !== selectedExercise?.id || !training || !component) return;

    if (selectedAthlete) {
      // use fetched data for selected athlete from api
      prepareSelectedAthleteAvgWorkloadsForChart(
        { exercise },
        {
          useGroup: groupContext,
          useTrainerDayViewContext: {
            ...trainerDayViewContext,
            training,
            component,
          },
          useChart: chartContext,
        }
      );
    } else {
      // group avg is already on training
      prepareGroupAvgWorkloadsForChart(
        { exercise, componentId: component.id },
        {
          useGroup: groupContext,
          useTrainerDayViewContext: {
            ...trainerDayViewContext,
            training,
            component,
          },
          useChart: chartContext,
        }
      );
    }
  }, [selectedAthleteWorkloads, trainings, selectedParams]);

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
