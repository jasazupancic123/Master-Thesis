'use client';

import { useScreenSize } from '@/context/screen-size-provider';
import { useTrainerDayViewContext } from '@/context/trainer-day-view-provider';
import {
  Superset,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import RemoveIcon from '@mui/icons-material/Remove';
import { Box, Grid2, IconButton, Slider, Typography } from '@mui/material';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import TrainingExerciseCard from './training-exercise-card';
import { useGroup } from '@/context/group-provider';
import { Workload } from '@/controller/training/type/workload.type';
import { useTheme } from '@mui/material/styles';
import { ChartWorkloadData } from '@/controller/training/type/chart-workload-data.type';
import {
  prepareSelectedAthleteAvgWorkloadsForChart,
  prepareGroupAvgWorkloadsForChart,
} from './state';
import { isBefore } from 'date-fns';

interface TrainingExerciseCardContainerProps {
  supersetIndex: number;
  exercise: TrainingExercise;
  selectedExercise: TrainingExercise | null;
  setSelectedExercise: Dispatch<SetStateAction<TrainingExercise | null>>;
  onAthleteView?: boolean;
  superior?: { row: boolean; column: boolean; all: boolean };
  setOpenVideoPlayerModal: Dispatch<SetStateAction<boolean>>;
  supersets: Superset[];
  setSupersetsWithAdd: Dispatch<SetStateAction<Superset[]>>;
}

export default function TrainingExerciseCardContainer(
  props: TrainingExerciseCardContainerProps
) {
  const screenSize = useScreenSize();
  const theme = useTheme();
  const {
    supersetIndex,
    exercise,
    selectedExercise,
    setSelectedExercise,
    superior,
    setOpenVideoPlayerModal,
    supersets,
    setSupersetsWithAdd,
  } = props;

  const { training, selectedAthlete } = useTrainerDayViewContext();
  const { trainings, workloads, group } = useGroup();
  const [data, setData] = useState<ChartWorkloadData[]>([]);
  const [percentageForChartBackground, setPercentageForChartBackground] =
    useState<number>(0);
  const [paddingForChartBackground, setPaddingForChartBackground] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  const [range, setRange] = useState<number[]>([1, 6]); // Example range
  const [max, setMax] = useState<number>(10);
  const handleChange = (_event: Event, newValue: number | number[]) => {
    setRange(newValue as number[]);
  };

  useEffect(() => {
    if (exercise.id !== selectedExercise?.id || !training) return;
    // useEffect to init avg workloads
    if (selectedAthlete) {
      // use fetched data for selected athlete from api
      prepareSelectedAthleteAvgWorkloadsForChart(
        workloads,
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
  }, [selectedExercise, workloads, trainings]);

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
    <Grid2
      container
      width="100%"
      height={!screenSize.isSmallerThanLaptop ? 300 : undefined}
      sx={{
        m: 0,
        p: 0,
        pt: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* First Row - Two Columns */}
      <Grid2 size={{ xs: screenSize.isSmallerThanLaptop ? 12 : 6 }}>
        <TrainingExerciseCard
          supersetIndex={supersetIndex}
          exercise={exercise}
          selectedExercise={selectedExercise}
          setSelectedExercise={setSelectedExercise}
          chartView={true}
          superior={superior}
          supersets={supersets}
          setSupersetsWithAdd={setSupersetsWithAdd}
          setOpenVideoPlayerModal={setOpenVideoPlayerModal}
        />
      </Grid2>
      <Grid2
        size={{ xs: screenSize.isSmallerThanLaptop ? 12 : 6 }}
        sx={{ pt: screenSize.isSmallerThanLaptop ? 2 : 0 }}
      >
        <Box
          width="100%"
          display="flex"
          alignItems="center"
          flexDirection="column"
        >
          <Typography variant="subtitle1" sx={{ color: 'rgb(108, 121, 134)' }}>
            <i>
              {selectedAthlete && selectedAthlete.displayName
                ? selectedAthlete.displayName.split(' ').length > 1
                  ? selectedAthlete.displayName?.split(' ')[0] +
                    ' ' +
                    selectedAthlete.displayName
                      ?.split(' ')
                      .slice(1)
                      .map((name) => name.toUpperCase())
                      .join(' ')
                  : selectedAthlete.displayName?.toUpperCase()
                : group.name}
            </i>
          </Typography>
          <Box
            width="100%"
            display="flex"
            flexDirection="column"
            alignItems="center"
            zIndex={1}
          >
            <Slider
              value={range}
              onChange={handleChange}
              valueLabelDisplay="off"
              min={1}
              max={max}
              step={1}
              sx={{
                width: '80%',
                color: 'background.paper',
                '& .MuiSlider-thumb': {
                  backgroundColor: '#1abc9c', // Green dots
                  width: 20,
                  height: 20,
                },
                '& .MuiSlider-track': {
                  height: 5,
                  backgroundColor: 'background.paper',
                },
                '& .MuiSlider-rail': {
                  backgroundColor: 'white',
                  height: 5,
                  opacity: 1,
                },
              }}
            />
            <Box display="flex" justifyContent="space-between" width="80%">
              <Typography variant="body2">First training</Typography>
              <Typography variant="body2">Last training</Typography>
            </Box>
          </Box>
          <Box sx={{ position: 'absolute', top: 5, right: 2, zIndex: 1000 }}>
            <IconButton
              sx={{ p: 0, m: 0, cursor: 'pointer' }}
              onClick={() => setSelectedExercise(null)}
            >
              <RemoveIcon />
            </IconButton>
          </Box>
        </Box>
      </Grid2>
      {/* Second Row - Graph */}
      <Grid2 size={{ xs: 12 }}>
        <Box
          sx={{
            width: '100%',
            maxHeight: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            position: 'relative',
          }}
        >
          {/* Background */}
          <Box
            width={`${100 - paddingForChartBackground.width}%`}
            height={`${100 - paddingForChartBackground.height}%`}
            display="flex"
            flexDirection="column"
            sx={{
              position: 'absolute',
              top: 5,
              right: 0,
              px: 0.5,
            }}
          >
            <Box height="100%" display="flex">
              <Box
                width={`${percentageForChartBackground}%`}
                //width="50%"
                height="100%"
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  zIndex: 0,
                }}
              />
              <Box
                width={`${100 - percentageForChartBackground}%`}
                height="100%"
                sx={{
                  zIndex: 0,
                }}
              />
            </Box>
          </Box>

          {/* Custom Legend */}
          <Box
            display="flex"
            justifyContent="flex-end"
            width="100%"
            sx={{
              position: 'absolute',
              top: -5,
              right: 5,
            }}
          >
            <Box display="flex" alignItems="center" mr={2}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: '#FF5555',
                  borderRadius: '50%',
                  mr: 1,
                }}
              />
              <Typography variant="body2" sx={{ color: '#fff' }}>
                Intensity
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: '#FFD700',
                  borderRadius: '50%',
                  mr: 1,
                }}
              />
              <Typography variant="body2" sx={{ color: '#fff' }}>
                Volume
              </Typography>
            </Box>
          </Box>

          {/* Graph */}
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.slice(range[0] - 1, range[1])}>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#222',
                  borderRadius: '10px',
                  color: '#fff',
                }}
              />
              <XAxis dataKey="name" />
              <YAxis domain={['dataMin - 3', 'dataMax + 3']} />
              <Line
                type="monotone"
                dataKey="intensity"
                stroke="#FF5555"
                strokeWidth={3}
                dot={true}
              />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="#FFD700"
                strokeWidth={3}
                dot={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Grid2>
    </Grid2>
  ) : (
    <TrainingExerciseCard
      supersetIndex={supersetIndex}
      exercise={exercise}
      selectedExercise={selectedExercise}
      setSelectedExercise={setSelectedExercise}
      superior={superior}
      supersets={supersets}
      setSupersetsWithAdd={setSupersetsWithAdd}
      setOpenVideoPlayerModal={setOpenVideoPlayerModal}
    />
  );
}
