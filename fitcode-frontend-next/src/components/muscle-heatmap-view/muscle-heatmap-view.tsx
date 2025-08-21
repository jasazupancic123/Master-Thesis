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

import MuscleMapWithTooltip from '../muscle-map-with-tooltip/muscle-map-with-tooltip';
import { theme } from '@/app/style';
import HeatmapBack from '@/assets/svg/heatmap-back.svg';
import HeatmapFront from '@/assets/svg/heatmap-front.svg';
import { HEATMAP_COLORS } from '@/common/constant/color.constant';
import { MuscleService } from '@/controller/exercise/muscle.service';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { useScreenSize } from '@/store/screen-size-provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view-provider';

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

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
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

  const { supersets } = useTrainerDayViewContext();

  const [exercises, setExercises] = useState<TrainingExercise[]>([]);

  const [heatmapLevel, setHeatmapLevel] = useState<number>(1);

  // type [Muscle(enum), color(string)]
  const [muscleLoads, setMuscleLoads] = useState<[string, number][]>([]);

  useEffect(() => {
    setExercises(supersets.flatMap((s) => s.exercises));
  }, [supersets]);

  useEffect(() => {
    // Generate muscle loads
    if (heatmapLevel < 1 || heatmapLevel > 3) return; // levels 1-3

    const loads = MuscleService.generateMuscleLoads(exercises, heatmapLevel);
    setMuscleLoads(loads);
  }, [exercises, heatmapLevel]);

  useEffect(() => {
    // Reset heatmap colors
    const resetContainers = ['heatmap-front', 'heatmap-back'];
    resetContainers.forEach((id) => {
      const container = document.getElementById(id);
      if (container) {
        container.querySelectorAll<HTMLElement>('*').forEach((el) => {
          (el as HTMLElement).style.fill = '';
        });
      }
    });

    // Update the heatmap colors based on the muscleColors state
    muscleLoads.forEach((load) => {
      const muscleType = load[0];
      const muscleLoad = load[1];

      // find all elements with the id
      const elements = document.querySelectorAll<HTMLElement>(
        `[id="${muscleType}"]`
      );
      if (!elements || elements.length === 0) return;

      const color = getMuscleColor(muscleLoad);
      if (!color) return;

      elements.forEach((el) => {
        el.style.fill = color;
      });
    });
  }, [muscleLoads]);

  const getMuscleColor = (load: number) => {
    let color = undefined;
    if (load >= 5 && load <= 10) color = HEATMAP_COLORS[0];
    else if (load >= 11 && load <= 25) color = HEATMAP_COLORS[1];
    else if (load >= 26 && load <= 35) color = HEATMAP_COLORS[2];
    else if (load >= 36 && load <= 50) color = HEATMAP_COLORS[3];
    else if (load >= 51 && load <= 55) color = HEATMAP_COLORS[4];
    else if (load >= 56) color = HEATMAP_COLORS[5];

    return color;
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
          Heatmap Level: {heatmapLevel}
        </Typography>
        <Slider
          value={heatmapLevel}
          onChange={(_, value) => setHeatmapLevel(value as number)}
          step={1}
          min={1}
          max={3}
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
                  maxHeight: screenSize.isReallySmall ? 350 : undefined,
                }
              : {}
          }
          position="relative"
        >
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

          <MuscleMapWithTooltip
            id="heatmap-front"
            Svg={HeatmapFront}
            exercises={supersets.flatMap((s) => s.exercises)}
            heatmapLevel={heatmapLevel}
          />
          <MuscleMapWithTooltip
            id="heatmap-back"
            Svg={HeatmapBack}
            exercises={supersets.flatMap((s) => s.exercises)}
            heatmapLevel={heatmapLevel}
          />

          {/* <HeatmapFront
            id="heatmap-front"
            role="img"
            aria-label="Front muscle map"
            style={{ maxHeight: 500 }}
          />
          <HeatmapBack
            id="heatmap-back"
            role="img"
            aria-label="Back muscle map"
            style={{ maxHeight: 500 }}
          /> */}
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
            <Tooltip content={<CustomTooltip />} />

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
