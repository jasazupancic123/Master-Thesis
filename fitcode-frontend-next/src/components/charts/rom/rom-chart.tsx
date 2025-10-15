import { theme } from '@/app/style';
import { KeypointUtil } from '@/controller/pose-detection/util/keypoint.util';
import { TrainingExerciseRecording } from '@/controller/training/type/training-exercise.type';
import { LineChart } from '@mui/x-charts';

interface TrainingInProgressRomChartProps {
  selectedExercise: TrainingExerciseRecording;
  setIndex: number;
  width: number;
  height?: number;
}

export default function TrainingInProgressRomChart(
  props: TrainingInProgressRomChartProps
) {
  const { selectedExercise, setIndex, width, height = 300 } = props;

  if (!selectedExercise.recordedSets) return null;

  const currentSet = selectedExercise.recordedSets.find(
    (s) => s.setIndex === setIndex
  );

  if (!currentSet) return null;

  const romL = KeypointUtil.smoothKeypointValues(
    currentSet.romL?.map((r) => r.value) || []
  ) as number[];
  const romR = KeypointUtil.smoothKeypointValues(
    currentSet.romR?.map((r) => r.value) || []
  ) as number[];

  if (!currentSet.romL && !currentSet.romR) return null;

  const dataset = romL
    .map((v, i) => ({
      valueL: v,
      valueR: romR[i],
      timestamp: currentSet.romL
        ? new Date(currentSet.romL[i]?.timestamp)
        : undefined,
    }))
    .filter((d) => d.valueL !== undefined);

  const firstRomTimestamp = dataset[0].timestamp;

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
          dataKey: 'timestamp',
          valueFormatter: (value: Date) => {
            if (!(value instanceof Date)) return '';

            const date = new Date(value);

            if (!firstRomTimestamp) return '';

            const diff = date.getTime() - firstRomTimestamp.getTime();

            const largestDiff = dataset[dataset.length - 1].timestamp
              ? dataset[dataset.length - 1].timestamp!.getTime() -
                firstRomTimestamp.getTime()
              : 0;

            const seconds = Math.floor(diff / 1000) + 1;

            const secondsLargestDiff = Math.floor(largestDiff / 1000) + 1;

            if (seconds === secondsLargestDiff) return '';

            return `${seconds}`;
          },
          disableTicks: true,
          scaleType: 'time',
        },
      ]}
      yAxis={[
        {
          disableTicks: true,
        },
      ]}
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
