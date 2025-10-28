import { Box, MenuItem, Select, Slider, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { theme } from '@/app/style';

import HeatmapBackYellow from '@/assets/svg/heatmap_back_yellow.svg';
import HeatmapFrontYellow from '@/assets/svg/heatmap_front_yellow.svg';
import MuscleMapWithTooltip from '@/components/muscle-map-with-tooltip/muscle-map-with-tooltip';
import { HEATMAP_COLORS } from '@/core/const/color.const';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import useMuscleHeatmap from './hooks/use-muscle-heatmap';
import { MuscleLoadType } from '@/core/exercise/enum/muscle-load-type.enum';
import { useGroup } from '@/store/group.provider';
import { core } from '@/core/core.service';

const data = [
  { time: '', value: 0 },
  { time: '15:00', value: 30 },
  { time: '30:00', value: 50 },
  { time: '45:00', value: 20 },
  { time: '60:00', value: 80 },
  { time: '75:00', value: 60 },
  { time: '90:00', value: 90 },
  { time: '105:00', value: 70 },
];

type DataPoint = {
  time: string;
  value: number;
};

type TooltipProps = {
  active?: boolean;
  payload?: { payload: DataPoint; value: number }[];
};

const CustomChartTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: '#2a2a2a',
          padding: '8px',
          borderRadius: '5px',
          color: '#fff',
        }}
      >
        <p>{`Time: ${payload[0].payload.time}`}</p>
        <p>{`Value: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

export default function MuscleHeatmapView() {
  const screenSize = useScreenSize();

  const { trainings } = useGroup();
  const { supersets, selectedAthlete } = useTrainerDayView();

  const [exercises, setExercises] = useState<TrainingExercise[]>([]);

  const {
    heatmapLevel,
    setHeatmapLevel,
    maxHeatmapLevel,
    muscleLoads,
    tipHeatmapFront,
    setTipHeatmapFront,
    tipHeatmapBack,
    setTipHeatmapBack,
    selectedLoadType,
    setSelectedLoadType,
    range,
    setRange,
  } = useMuscleHeatmap(exercises);

  useEffect(() => {
    setExercises(supersets.flatMap((s) => s.exercises));
  }, [supersets]);

  const handleChange = (_event: Event, newValue: number | number[]) => {
    setRange(newValue as number[]);
  };

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      {/* Slider here */}
      <Box
        width={
          screenSize.isMobile
            ? '75%'
            : screenSize.isSmallerThanLaptop
              ? '50%'
              : '25%'
        }
        mb={2}
      >
        <Typography gutterBottom align="center">
          Heatmap Level: {Math.max(1, heatmapLevel)}
        </Typography>

        <Slider
          value={heatmapLevel}
          onChange={(_, value) => setHeatmapLevel(value as number)}
          step={1}
          min={1}
          max={maxHeatmapLevel}
          sx={{
            color: theme.palette.common.white,
          }}
          valueLabelDisplay="auto"
        />
      </Box>
      <Box
        width="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        gap={5}
        sx={{
          flexDirection: screenSize.isSmallerThanLaptop ? 'column' : 'row',
        }}
      >
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          gap={1}
        >
          <Box
            width="100%"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
          >
            <Select
              value={selectedLoadType}
              onChange={(e) =>
                setSelectedLoadType(e.target.value as 'ALL' | MuscleLoadType)
              }
              sx={{
                '& .MuiSelect-select': {
                  p: 1,
                },
              }}
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value={MuscleLoadType.CONCENTRIC}>Concentric</MenuItem>
              <MenuItem value={MuscleLoadType.ECCENTRIC}>Eccentric</MenuItem>
              <MenuItem value={MuscleLoadType.ISOMETRIC}>Isometric</MenuItem>
            </Select>
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
                max={trainings.length}
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
                {selectedAthlete && selectedAthlete.displayName && (
                  <Typography variant="subtitle1">
                    <i>
                      {core.training.athlete.getShortName(
                        selectedAthlete.displayName
                      )}
                    </i>
                  </Typography>
                )}
                <Typography variant="body2">Last training</Typography>
              </Box>
            </Box>
          </Box>
          <Box
            sx={
              screenSize.isSmallerThanLaptop
                ? {
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    flexWrap: 'nowrap',
                    maxHeight: screenSize.isReallySmall ? 350 : undefined,
                  }
                : {}
            }
            position="relative"
          >
            <MuscleMapWithTooltip
              front={true}
              Svg={HeatmapFrontYellow}
              exercisesInComponent={supersets.flatMap((s) => s.exercises)}
              heatmapLevel={heatmapLevel}
              maxHeatmapLevel={maxHeatmapLevel}
              muscleLoads={muscleLoads}
              tip={tipHeatmapFront}
              setTip={setTipHeatmapFront}
              selectedLoadType={selectedLoadType}
            />
            <MuscleMapWithTooltip
              front={false}
              Svg={HeatmapBackYellow}
              exercisesInComponent={supersets.flatMap((s) => s.exercises)}
              heatmapLevel={heatmapLevel}
              maxHeatmapLevel={maxHeatmapLevel}
              muscleLoads={muscleLoads}
              tip={tipHeatmapBack}
              setTip={setTipHeatmapBack}
              selectedLoadType={selectedLoadType}
            />

            {/* Legend */}
            <Box
              display="flex"
              flexDirection="column-reverse"
              sx={{
                position: 'absolute',
                bottom: 20,
                right: screenSize.isSmallerThanLaptop ? '50%' : -50,
                transform: screenSize.isSmallerThanLaptop
                  ? 'translateX(+50%)'
                  : 'none',
              }}
              gap={1}
            >
              {HEATMAP_COLORS.map((color, index) => (
                <Box
                  key={index}
                  bgcolor={color}
                  width={screenSize.isMobile ? 40 : 100}
                  height={screenSize.isMobile ? 3 : 5}
                />
              ))}
            </Box>
          </Box>
        </Box>
        <ResponsiveContainer
          width={screenSize.isSmallerThanLaptop ? '100%' : '35%'}
          height={400}
        >
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00aaff" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#00aaff" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="time" stroke="#aaa" />
            <YAxis stroke="#aaa" />
            <Tooltip content={<CustomChartTooltip />} />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#00aaff"
              fillOpacity={1}
              fill="url(#colorUv)"
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#ffffff"
              strokeWidth={2}
              dot={false}
            />
            <Scatter
              data={data}
              dataKey="value"
              fill="#fff"
              stroke="#000"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
