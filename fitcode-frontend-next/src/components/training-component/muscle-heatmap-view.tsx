import { Box, Slider, Typography } from '@mui/material';
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

import { paintHeatmaps } from './actions/actions-color-heatmap';
import { theme } from '@/app/style';
//import HeatmapBack from '@/assets/svg/heatmap-back.svg';
import HeatmapBackNew from '@/assets/svg/heatmap_back_new.svg';
import HeatmapFront from '@/assets/svg/heatmap-front.svg';
import MuscleMapWithTooltip from '@/components/muscle-map-with-tooltip/muscle-map-with-tooltip';
import { HEATMAP_COLORS } from '@/core/const/color.const';
import { core } from '@/core/core.service';
import type { MuscleTip } from '@/core/exercise/type/muscle-tip.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import { HeatmapLoad } from '@/core/exercise/type/heatmap-load.entity';
import { MuscleUtil } from '@/core/exercise/utils/muscle.util';

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

  const { supersets } = useTrainerDayView();

  const [exercises, setExercises] = useState<TrainingExercise[]>([]);

  const [heatmapLevel, setHeatmapLevel] = useState<number>(0);
  const [maxHeatmapLevel, setMaxHeatmapLevel] = useState<number>(0);

  const [muscleLoads, setMuscleLoads] = useState<[string, HeatmapLoad][]>([]);

  const [tipHeatmapFront, setTipHeatmapFront] = useState<MuscleTip>({
    show: false,
    x: 0,
    y: 0,
    componentExercises: [],
    possibleExercises: [],
    focus: false,
  });

  const [tipHeatmapBack, setTipHeatmapBack] = useState<MuscleTip>({
    show: false,
    x: 0,
    y: 0,
    componentExercises: [],
    possibleExercises: [],
    focus: false,
  });

  useEffect(() => {
    if (tipHeatmapBack.show && tipHeatmapFront.show) {
      setTipHeatmapFront((prev) => ({ ...prev, show: false, focus: false }));
      setTipHeatmapBack((prev) => ({ ...prev, show: false, focus: false }));
    }
  }, [tipHeatmapFront, tipHeatmapBack]);

  useEffect(() => {
    setExercises(supersets.flatMap((s) => s.exercises));
  }, [supersets]);

  useEffect(() => {
    // Generate muscle loads
    if (heatmapLevel > maxHeatmapLevel) return; // levels 1-3

    const loads = core.exercise.muscle.generateLoads(
      exercises,
      heatmapLevel,
      maxHeatmapLevel
    );

    setMuscleLoads(loads);
  }, [exercises, heatmapLevel, maxHeatmapLevel]);

  useEffect(() => {
    const newHeatmapLevel = core.exercise.muscle.getHeatmapLevel(muscleLoads);
    setMaxHeatmapLevel(newHeatmapLevel);

    paintHeatmaps(muscleLoads);
  }, [muscleLoads]);

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
          Heatmap Level: {heatmapLevel}
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
            Svg={HeatmapFront}
            exercisesInComponent={supersets.flatMap((s) => s.exercises)}
            heatmapLevel={heatmapLevel}
            maxHeatmapLevel={maxHeatmapLevel}
            muscleLoads={muscleLoads}
            tip={tipHeatmapFront}
            setTip={setTipHeatmapFront}
          />
          <MuscleMapWithTooltip
            front={false}
            Svg={HeatmapBackNew}
            exercisesInComponent={supersets.flatMap((s) => s.exercises)}
            heatmapLevel={heatmapLevel}
            maxHeatmapLevel={maxHeatmapLevel}
            muscleLoads={muscleLoads}
            tip={tipHeatmapBack}
            setTip={setTipHeatmapBack}
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
