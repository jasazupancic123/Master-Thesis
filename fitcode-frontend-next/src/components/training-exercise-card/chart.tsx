'use client';

import RemoveIcon from '@mui/icons-material/Remove';
import {
  Box,
  Checkbox,
  Grid2,
  IconButton,
  Slider,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import CustomTooltip from './chart-custom-tooltip';
import { TodayDot } from './chart-today-dot';
import useTrainingExerciseCardChart from './hooks/use-chart.hook';
import TrainingExerciseCard from './training-exercise-card';
import { GRAPH_COLORS } from '@/core/const/color.const';
import { core } from '@/core/core.service';
import type { ExerciseParamField } from '@/core/training/type/exercise-set.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { useGroup } from '@/store/group.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useSupersets } from '@/store/supersets.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

export const graphColorMap: Record<ExerciseParamField, string> = {
  loadKg: GRAPH_COLORS[0],
  loadKgR: GRAPH_COLORS[0],
  loadRm: GRAPH_COLORS[0],
  loadRmR: GRAPH_COLORS[0],
  loadBw: GRAPH_COLORS[0],
  loadBwR: GRAPH_COLORS[0],
  reps: GRAPH_COLORS[1],
  repsR: GRAPH_COLORS[1],
  sets: GRAPH_COLORS[2],
  tempo: GRAPH_COLORS[4],
  tempoR: GRAPH_COLORS[4],
  vel: GRAPH_COLORS[5],
  velR: GRAPH_COLORS[5],
  time: GRAPH_COLORS[6],
  dist: GRAPH_COLORS[6],
  recTime: GRAPH_COLORS[7],
  recDist: GRAPH_COLORS[7],
  eff: GRAPH_COLORS[7],
} as const;

export const DEFAULT_CHART_PARAMS: ExerciseParamField[] = ['loadKg', 'reps'];

interface TrainingExerciseSelectedProps {
  supersetIndex: number;
  exercise: TrainingExercise;
  onAthleteView?: boolean;
}

export default function TrainingExerciseChart(
  props: TrainingExerciseSelectedProps
) {
  const { supersetIndex, exercise } = props;
  const screenSize = useScreenSize();
  const theme = useTheme();

  const { group } = useGroup();
  const { selectedAthlete } = useTrainerDayView();
  const { setSelectedExercise } = useSupersets();

  const {
    chartData,
    selectedParams,
    setSelectedParams,
    range,
    setRange,
    max,
    paddingForChartBackground,
    percentageForChartBackground,
  } = useTrainingExerciseCardChart({ exercise });

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
          chartView
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
            mt: screenSize.isSmallerThanLaptop ? 5 : undefined,
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
                  backgroundColor: theme.palette.background.dark,
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
            width="100%"
            display="flex"
            justifyContent={
              screenSize.isSmallerThanLaptop ? 'center' : 'flex-start'
            }
            sx={{ position: 'absolute', top: -35, left: 10 }}
          >
            {DEFAULT_CHART_PARAMS.map((p) => core.exercise.param.get(p)!).map(
              (p) => (
                <Box key={p.field} display="flex" alignItems="center" mr={2}>
                  <Checkbox
                    size="small"
                    checked={selectedParams.some((param) => param === p.field)} // your state
                    onChange={(e) => {
                      if (e.target.checked)
                        // add to selected
                        setSelectedParams((prev) => [
                          ...prev,
                          p.field as ExerciseParamField,
                        ]);
                      else
                        setSelectedParams((prev) =>
                          prev.filter((param) => param !== p.field)
                        );
                    }} // your handler
                    sx={{
                      p: 0.5,
                      color: graphColorMap[p.field], // unchecked color
                      '&.Mui-checked': { color: graphColorMap[p.field] }, // checked color
                    }}
                  />
                  <Typography variant="body2">
                    {p.name[0].toUpperCase() + p.name.slice(1)}
                  </Typography>
                </Box>
              )
            )}
          </Box>

          {/* Graph */}
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData.slice(range[0] - 1, range[1])}>
              <Tooltip content={CustomTooltip} />
              <XAxis dataKey="name" />
              <YAxis domain={['dataMin - 3', 'dataMax + 3']} />

              <Line
                type="monotone"
                dataKey="int"
                stroke={GRAPH_COLORS[0]}
                strokeWidth={3}
                dot={<TodayDot />}
              />

              <Line
                type="monotone"
                dataKey="vol"
                stroke={GRAPH_COLORS[1]}
                strokeWidth={3}
                dot={<TodayDot />}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Grid2>
    </Grid2>
  );
}
