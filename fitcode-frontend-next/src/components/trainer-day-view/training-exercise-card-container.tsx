'use client';

import { useScreenSize } from '@/context/screen-size-provider';
import { useTrainerDayViewContext } from '@/context/trainer-day-view-provider';
import {
  Superset,
  TrainingExercise,
} from '@/controller/training/type/training-plan.type';
import RemoveIcon from '@mui/icons-material/Remove';
import { Box, Grid2, IconButton, Slider, Typography } from '@mui/material';
import { Dispatch, SetStateAction, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';
import TrainingExerciseCard from './training-exercise-card';

const data = [
  { name: 'A', intensity: 50, volume: 80 },
  { name: 'B', intensity: 70, volume: 60 },
  { name: 'C', intensity: 40, volume: 90 },
  { name: 'D', intensity: 90, volume: 40 },
  { name: 'E', intensity: 60, volume: 70 },
  { name: 'F', intensity: 80, volume: 50 },
  { name: 'G', intensity: 55, volume: 85 },
  { name: 'H', intensity: 75, volume: 65 },
  { name: 'I', intensity: 45, volume: 95 },
  { name: 'J', intensity: 85, volume: 45 },
];

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

  const { selectedAthlete } = useTrainerDayViewContext();

  const [range, setRange] = useState<number[]>([1, 10]); // Example range
  const handleChange = (_event: Event, newValue: number | number[]) => {
    setRange(newValue as number[]);
  };

  return selectedAthlete && exercise === selectedExercise ? (
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
              {selectedAthlete.displayName?.split(' ')[0] || ''}{' '}
              {selectedAthlete.displayName
                ?.split(' ')
                .slice(1)
                .map((name) => name.toUpperCase())
                .join(' ') || ''}
            </i>
          </Typography>
          <Box
            width="100%"
            display="flex"
            flexDirection="column"
            alignItems="center"
          >
            <Slider
              value={range}
              onChange={handleChange}
              valueLabelDisplay="off"
              min={1}
              max={10}
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
              <Typography variant="body2">1st training</Typography>
              <Typography variant="body2">last</Typography>
            </Box>
          </Box>
          <Box sx={{ position: 'absolute', top: 5, right: 20 }}>
            <IconButton
              sx={{ p: 0, m: 0 }}
              onClick={() => setSelectedExercise(null)}
            >
              <RemoveIcon />
            </IconButton>
          </Box>
        </Box>
      </Grid2>

      {/* Second Row - Graph */}
      <Grid2 size={{ xs: 12 }} sx={{ height: '100%' }}>
        <Box
          sx={{
            width: '100%',
            maxHeight: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
          }}
        >
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
              <defs>
                <filter id="glow-red">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glow-yellow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <Line
                type="monotone"
                dataKey="intensity"
                stroke="#FF5555"
                strokeWidth={3}
                filter="url(#glow-red)"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="#FFD700"
                strokeWidth={3}
                filter="url(#glow-yellow)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Custom Legend */}
          <Box
            display="flex"
            justifyContent="center"
            mt={2}
            sx={{ position: 'absolute', bottom: 20, left: 20 }}
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
