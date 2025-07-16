'use client';

import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';
import { TrainingExercise } from '@/controller/training/type/training-plan.type';
import RemoveIcon from '@mui/icons-material/Remove';
import { Box, Grid2, IconButton, Slider, Typography } from '@mui/material';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import TrainingExerciseCard from '../training-exercise-card/training-exercise-card';
import { useGroup } from '@/store/group-provider';
import { useTheme } from '@mui/material/styles';
import { ChartWorkloadData } from '@/controller/training/type/chart-workload-data.type';
import { Dimensions } from '@/common/type/dimensions.type';
import { SetState } from '@/common/type/state.type';
import { useSupersets } from '@/store/supersets-provider';

interface TrainignExerciseSelectedProps {
  supersetIndex: number;
  exercise: TrainingExercise;
  range: number[];
  setRange: SetState<number[]>;
  paddingForChartBackground: Dimensions;
  percentageForChartBackground: number;
  max: number;
  data: ChartWorkloadData[];
  onAthleteView?: boolean;
  superior?: { row: boolean; column: boolean; all: boolean };
}

export default function TrainignExerciseSelected(
  props: TrainignExerciseSelectedProps
) {
  const screenSize = useScreenSize();
  const theme = useTheme();

  const { setSelectedExercise } = useSupersets();
  const { selectedAthlete } = useTrainerDayViewContext();
  const { group } = useGroup();

  const {
    supersetIndex,
    exercise,
    superior,
    range,
    setRange,
    max,
    paddingForChartBackground,
    percentageForChartBackground,
    data,
  } = props;

  const handleChange = (_event: Event, newValue: number | number[]) => {
    setRange(newValue as number[]);
  };

  return (
    <Grid2
      container
      width="100%"
      height={!screenSize.isSmallerThanLaptop ? 300 : undefined}
      sx={{
        m: 0,
        p: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* First Row - Two Columns */}
      <Grid2 size={{ xs: screenSize.isSmallerThanLaptop ? 12 : 6 }}>
        <TrainingExerciseCard
          supersetIndex={supersetIndex}
          exercise={exercise}
          chartView={true}
          superior={superior}
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
                  backgroundColor: theme.palette.primary.main,
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
              <Typography variant="body2">Intensity</Typography>
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
              <Typography variant="body2">Volume</Typography>
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
  );
}
