'use client';

import { Box, Popper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import {
  prepareGroupAvgWorkloadsForChart,
  prepareSelectedAthleteAvgWorkloadsForChart,
} from '../trainer-day-view/state';
import TrainingExerciseCard from '../training-exercise-card/training-exercise-card';
import { isNumber } from '../training-exercise-selected/state';
import TrainingExerciseSelected from '../training-exercise-selected/training-exercise-selected';
import type { Dimensions } from '@/common/type/dimensions.type';
import type { ParamType } from '@/controller/component/enum/param.enum';
import type { ChartWorkloadData } from '@/controller/training/type/chart-workload-data.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useGroup } from '@/store/group.provider';
import { useSupersets } from '@/store/supersets.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';
import { useTheme } from '@mui/material';

export interface TrainingExerciseCardContainerProps {
  supersetIndex: number;
  exercise: TrainingExercise;
  onAthleteView?: boolean;
  superior?: { row: boolean; column: boolean; all: boolean };
}

export default function TrainingExerciseCardContainer(
  props: TrainingExerciseCardContainerProps
) {
  const theme = useTheme();

  const {
    selectedExercise,
    openNumericInput,
    numericInputAnchorEl,
    setsNumbers,
    setSetsNumbers,
    selectedNumericInputParam,
  } = useSupersets();

  const {
    training,
    selectedAthlete,
    selectedAthleteCompletedWorkloads: selectedAthleteWorkloads,
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
  const [selectedParams, setSelectedParams] = useState<ParamType[]>([]);

  const inputValues = [0.25, 0.5, 1, 2, 5, 10, 20, 50];

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
    if (exercise.id !== selectedExercise?.id || !training || !component) return;
    // useEffect to init avg workloads for chart
    if (selectedAthlete) {
      // use fetched data for selected athlete from api
      prepareSelectedAthleteAvgWorkloadsForChart({
        selectedAthleteWorkloads,
        trainings,
        training,
        component,
        exercise,
        selectedAthlete,
        selectedSubgroup,
        selectedParams,
        setData,
        setMax,
        setRange,
      });
    } else {
      // group avg is already on training
      prepareGroupAvgWorkloadsForChart(
        trainings,
        training,
        component.id,
        exercise,
        selectedParams,
        setData,
        setMax,
        setRange
      );
    }
  }, [selectedAthleteWorkloads, trainings, selectedParams]);

  useEffect(() => {
    // Set the percentage for the chart background (completed vs future) based on the range
    if (exercise.id !== selectedExercise?.id) return;

    const newDataInRange = data.slice(range[0] - 1, range[1]);

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

  return (
    <Box position="relative">
      {exercise.id === selectedExercise?.id ? (
        <TrainingExerciseSelected
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
          selectedParams={selectedParams}
          setSelectedParams={setSelectedParams}
        />
      ) : (
        <TrainingExerciseCard
          supersetIndex={supersetIndex}
          exercise={exercise}
          superior={superior}
        />
      )}
      {openNumericInput && (
        <Popper
          open={openNumericInput && Boolean(numericInputAnchorEl)}
          anchorEl={numericInputAnchorEl}
          placement="right-start"
          modifiers={[
            { name: 'offset', options: { offset: [8, 0] } }, // 8px gap to the right
          ]}
          sx={{
            zIndex: 1000,
          }}
        >
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            sx={{
              backgroundColor: theme.palette.background.default,
              border: `1px solid ${theme.palette.primary.main}`,
              borderRadius: 2,
            }}
          >
            <Typography textAlign="center">
              {selectedNumericInputParam?.selected &&
              selectedNumericInputParam?.selected.length
                ? selectedNumericInputParam.selected[0].toUpperCase() +
                  selectedNumericInputParam.selected.slice(1)
                : ''}
            </Typography>
            <Box
              width={100}
              display="flex"
              justifyContent="center"
              flexWrap="wrap"
              alignItems="flex-start"
              sx={{
                px: 1,
              }}
            >
              {inputValues.map((v) => (
                <Box
                  key={v}
                  width={40}
                  height={40}
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Typography textAlign="center" fontSize={14}>
                    {v}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Popper>
      )}
    </Box>
  );
}
