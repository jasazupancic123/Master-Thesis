import { axisClasses, LineChart } from '@mui/x-charts';
import dayjs from 'dayjs';

import { theme } from '@/app/style';
import type { TrainingExerciseRecording } from '@/core/training/type/training-exercise.type';
import { lib } from '@/lib';

interface Props {
  selectedExercise: TrainingExerciseRecording;
  setIndex: number;
  width: number;
  height?: number;
}

export default function RomChart({
  selectedExercise,
  setIndex,
  width,
  height = 300,
}: Props) {
  if (!selectedExercise.recordedSets) return null;

  const currentSet = selectedExercise.recordedSets.find(
    (s) => s.setIndex === setIndex
  );

  if (!currentSet) return null;

  const earliestRepStart = Math.min(
    ...(currentSet.repsL?.map(
      (r) => new Date(r.startTimestamp).getTime() || 0
    ) || []),
    ...(currentSet.repsR?.map(
      (r) => new Date(r.startTimestamp).getTime() || 0
    ) || [])
  );

  const romL = lib.ai.keypoint.smoothKeypointValues(
    currentSet.romL
      ?.filter(
        (r) =>
          new Date(r.timestamp).getTime() >=
          dayjs(earliestRepStart).subtract(1, 'second').toDate().getTime()
      )
      .map((r) => r.value) || []
  ) as number[];

  let romR = lib.ai.keypoint.smoothKeypointValues(
    currentSet.romR
      ?.filter(
        (r) =>
          new Date(r.timestamp).getTime() >=
          dayjs(earliestRepStart).subtract(1, 'second').toDate().getTime()
      )
      .map((r) => r.value) || []
  ) as number[];

  const firstRomL = romL[0];
  const firstRomR = romR[0];

  if (
    firstRomL !== undefined &&
    firstRomR !== undefined &&
    Math.abs(firstRomL - firstRomR) < 0.05
  ) {
    // if L and R starts are less than 0.05 radian difference, align it to the same value, priorizite left
    const offset = firstRomL - firstRomR;

    romR = romR.map((r) => r + offset);
  }

  if (!currentSet.romL && !currentSet.romR) return null;

  const dataset = (romR && romR.length > romL.length ? romR : romL)
    .map((v, i) => ({
      index: i,
      valueL: romL[i],
      valueR: romR ? romR[i] : undefined,
      timestamp: currentSet.romL
        ? new Date(currentSet.romL[i]?.timestamp)
        : undefined,
    }))
    .filter((d) => d.valueL !== undefined || d.valueR !== undefined);

  const SMOOTH = false;

  if (SMOOTH) {
    const valuesL = dataset.map((d) => d.valueL);
    const valuesR = dataset.map((d) => d.valueR).filter((v) => v !== undefined);

    const smoothedL = lib.ai.keypoint.smoothKeypointValues(valuesL) as number[];

    const smoothedR = valuesR
      ? (lib.ai.keypoint.smoothKeypointValues(valuesR) as number[])
      : [];

    dataset.forEach((d, i) => {
      d.valueL = smoothedL[i];
      d.valueR = smoothedR[i];
    });
  }

  if (!dataset.length) return null;

  const firstRomTimestamp = dataset[0]?.timestamp;

  const isUnilateral = selectedExercise.exercise?.isUnilateral;

  return (
    <LineChart
      width={width}
      height={height}
      dataset={dataset}
      slotProps={{
        legend: {
          position: { vertical: 'bottom' },
        },
      }}
      xAxis={[
        {
          // dataKey: 'index',
          dataKey: 'timestamp',
          label: 'Time (s)',
          valueFormatter: (value: Date) => {
            if (!(value instanceof Date)) return '';
            const date = new Date(value);
            if (!firstRomTimestamp) return '';
            const diff = date.getTime() - firstRomTimestamp.getTime();
            const largestDiff = dataset[dataset.length - 1].timestamp
              ? dataset[dataset.length - 1].timestamp!.getTime() -
                firstRomTimestamp.getTime()
              : 0;
            const seconds = Math.floor(diff / 1000);
            const secondsLargestDiff = Math.floor(largestDiff / 1000);
            if (seconds === secondsLargestDiff) return '';
            return `${seconds}`;
          },
          min: firstRomTimestamp,
          scaleType: 'time',
        },
      ]}
      yAxis={[
        {
          label: 'ROM (m)',
        },
      ]}
      sx={{
        [`& .${axisClasses.bottom} .${axisClasses.line}`]: {
          display: 'none',
        },
        [`& .${axisClasses.left} .${axisClasses.label}`]: {
          transform: 'translateX(10px)',
        },
        '& .MuiChartsLegend-root': {
          transform: 'translateX(15px)',
        },
        '& [class*="MuiChartsSurface-root"]': {
          transform: 'translateX(-10px) !important',
        },
      }}
      margin={{
        right: 0,
        bottom: 0,
        left: 0,
        top: 16,
      }}
      series={
        isUnilateral
          ? [
              {
                dataKey: 'valueL',
                label: 'ROM (L)',
                color: theme.palette.primary.main,
                showMark: false,
              },
              {
                dataKey: 'valueR',
                label: 'ROM (R)',
                color: theme.palette.info.main,
                showMark: false,
              },
            ]
          : [
              {
                dataKey: 'valueL',
                label: 'ROM',
                color: theme.palette.primary.main,
                showMark: false,
              },
            ]
      }
    />
  );
}
