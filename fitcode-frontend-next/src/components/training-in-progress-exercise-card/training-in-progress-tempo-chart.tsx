import type { SxProps } from '@mui/material';
import {
  axisClasses,
  BarChart,
  ChartsReferenceLine,
  useXScale,
  useYScale,
} from '@mui/x-charts';
import { useRef } from 'react';

import { theme } from '@/app/style';
import { EXERCISE_POSES } from '@/controller/pose-detection/const/exercise-poses';
import { ConditionDirection } from '@/controller/pose-detection/enum/condition-detection.enum';
import type { Rep, RepInfo } from '@/controller/pose-detection/type/rep.type';
import type { TrainingExerciseRecording } from '@/controller/training/type/training-exercise.type';

function IsoOverlay({ reps }: { reps: RepInfo[] }) {
  const xScale = useXScale(); // band scale
  const yScale = useYScale(); // linear scale [-1, 1]

  const y0 = yScale(0);
  const hasBandwidth = typeof (xScale as any).bandwidth === 'function';

  return (
    <g pointerEvents="none">
      {reps.map((r) => {
        const xBase = (xScale as any)(r.repNumber.toString());
        if (xBase === null) return null;
        const xCenter = hasBandwidth
          ? xBase + (xScale as any).bandwidth() / 2
          : xBase;
        const yIso = yScale(r.timeAtExtremeMs / 1000); // pixel position for +isometric up from 0
        return (
          <g key={r.repNumber}>
            {/* border layer (thicker, darker) */}
            <line
              x1={xCenter}
              x2={xCenter}
              y1={y0}
              y2={yIso}
              stroke={theme.palette.background.lightBorder}
              strokeWidth={4} // outer width
              strokeLinecap="round"
            />
            <line
              x1={xCenter}
              x2={xCenter}
              y1={y0}
              y2={yIso}
              stroke={theme.palette.background.default}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </g>
  );
}

interface TrainingInProgressTempoChartProps {
  selectedExercise: TrainingExerciseRecording | undefined;
  setIndex: number;
  width: number;
  height?: number;
  passedReps?: Rep[];
  hideLabels?: boolean;
  sx?: SxProps;
  aiRecordingView?: boolean;
}

export default function TrainingInProgressTempoChart(
  props: TrainingInProgressTempoChartProps
) {
  const {
    selectedExercise,
    setIndex,
    width,
    height = 300,
    passedReps,
    hideLabels = false,
    sx,
    aiRecordingView,
  } = props;

  const maxValueRef = useRef(0);
  const currentRepsRef = useRef<RepInfo[] | null>(passedReps || null);

  if (!selectedExercise || (!selectedExercise.recordedSets && !passedReps))
    return null;

  const exercisePose = EXERCISE_POSES.find((e) =>
    e.exerciseIds.includes(selectedExercise.id)
  );

  if (!exercisePose) return;

  const direction: ConditionDirection = exercisePose.data.romStartDirection;

  if (!passedReps) {
    if (selectedExercise.recordedSets) {
      const set = selectedExercise.recordedSets.find(
        (s) => s.setIndex === setIndex
      );

      if (set) {
        currentRepsRef.current = set.reps;
      } else currentRepsRef.current = null;
    }
  }

  if (!currentRepsRef.current) {
    return null;
  }

  // demoReps -> from state, use for testing
  currentRepsRef.current.forEach((rep) => {
    const biggest = Math.max(
      rep.timeToExtremeMs ?? 0,
      rep.timeAtExtremeMs ?? 0,
      rep.timeFromExtremeToEndMs ?? 0
    );
    if (biggest > maxValueRef.current) maxValueRef.current = biggest;
  });

  const rows = currentRepsRef.current.map((r) => {
    return direction === ConditionDirection.POSITIVE
      ? {
          id: r.repNumber,
          label: `${r.repNumber}`,
          concentric: (r.timeToExtremeMs || 0) / 1000,
          eccentric:
            r.timeFromExtremeToEndMs !== undefined
              ? (-1 * r.timeFromExtremeToEndMs) / 1000
              : 0,
          isometric: (r.timeAtExtremeMs || 0) / 1000,
          isometricFake: 0,
        }
      : {
          id: r.repNumber,
          label: `${r.repNumber}`,
          concentric:
            r.timeFromExtremeToEndMs !== undefined
              ? r.timeFromExtremeToEndMs / 1000
              : 0,
          eccentric: (-1 * (r.timeToExtremeMs || 0)) / 1000,
          isometric: (r.timeAtExtremeMs || 0) / 1000,
          isometricFake: 0,
        };
  });

  return (
    <BarChart
      dataset={rows}
      hideLegend={hideLabels}
      xAxis={[
        {
          scaleType: 'band',
          dataKey: 'label',
          disableLine: hideLabels,
          disableTicks: hideLabels,
          tickLabelStyle: { display: hideLabels ? 'none' : 'block' },
        },
      ]}
      yAxis={[
        {
          min: -1 * (maxValueRef.current / 1000),
          max: 1 * (maxValueRef.current / 1000),
          label: hideLabels ? '' : 'Time (s)',
          disableLine: hideLabels,
          disableTicks: hideLabels,
          tickLabelStyle: { display: hideLabels ? 'none' : 'block' },
        },
      ]}
      borderRadius={8}
      margin={{
        right: 0,
        bottom: aiRecordingView ? -10 : 0,
        left: aiRecordingView ? -16 : 0,
        top: aiRecordingView ? 10 : 16,
      }}
      series={[
        {
          dataKey: 'concentric',
          label: 'Concentric',
          stack: 'time',
          valueFormatter: (v) => {
            if (!v) return '–';
            return `Concentric phase: ${Math.abs(v).toFixed(1)}s`;
          },
          color: theme.palette.primary.main,
        },
        {
          dataKey: 'eccentric',
          label: 'Eccentric',
          stack: 'time',
          valueFormatter: (v) => {
            if (!v) return '–';
            return `Eccentric phase: ${Math.abs(v).toFixed(1)}s`;
          },
          color: theme.palette.secondary.main,
        },
        {
          dataKey: 'isometricFake',
          label: 'Isometric',
          stack: 'time',
          valueFormatter: (v, ctx) => {
            const row = rows.find((r) => r.id === ctx.dataIndex + 1);
            if (!row || !row.isometric) return 'Isometric phase: –';
            return `Isometric phase: ${Math.abs(row.isometric).toFixed(1)}s`;
          },
          color: 'none',
        },
      ]}
      width={width}
      height={height}
      sx={{
        transform: !aiRecordingView ? 'translateX(-15px)' : undefined,
        [`& .${axisClasses.bottom} .${axisClasses.line}`]: {
          display: 'none',
        },
        [`& .${axisClasses.left} .${axisClasses.label}`]: {
          transform: 'translateX(15px)',
        },
        '& .MuiChartsLegend-root': {
          transform: 'translateX(15px)',
        },
        '& [class*="MuiChartsSurface-root"]': {
          transform: aiRecordingView
            ? 'translateX(-20px) !important'
            : undefined,
        },
        ...sx,
      }}
    >
      {/* Dotted Zero baseline */}
      <ChartsReferenceLine
        y={0}
        lineStyle={{ strokeDasharray: '4 4', strokeWidth: 2, opacity: 0.7 }}
      />

      {/* Isometric line in middle of the bar */}
      <IsoOverlay reps={currentRepsRef.current} />
    </BarChart>
  );
}
