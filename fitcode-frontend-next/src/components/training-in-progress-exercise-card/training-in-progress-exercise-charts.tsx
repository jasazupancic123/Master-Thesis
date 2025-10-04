import { theme } from '@/app/style';
import { Rep, RepInfo } from '@/controller/pose-detection/type/rep.type';
import { TrainingExerciseRecording } from '@/controller/training/type/training-exercise.type';
import {
  axisClasses,
  BarChart,
  ChartsReferenceLine,
  useXScale,
  useYScale,
} from '@mui/x-charts';
import { useRef } from 'react';

function IsoOverlay({ reps }: { reps: RepInfo[] }) {
  const xScale = useXScale(); // band scale
  const yScale = useYScale(); // linear scale [-1, 1]

  const y0 = yScale(0);
  const hasBandwidth = typeof (xScale as any).bandwidth === 'function';

  return (
    <g pointerEvents="none">
      {reps.map((r) => {
        const xBase = (xScale as any)(r.repNumber.toString());
        if (xBase == null) return null;
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

interface TrainingInProgressExerciseChartsProps {
  selectedExercise: TrainingExerciseRecording | undefined;
  setIndex: number;
  width: number; // default 200
  showLabels?: boolean; // default false
}

export default function TrainingInProgressTempoChart(
  props: TrainingInProgressExerciseChartsProps
) {
  const { selectedExercise, setIndex, width, showLabels = false } = props;

  const maxValueRef = useRef(0);

  if (!selectedExercise || !selectedExercise.recordedSets) return;

  const set = selectedExercise.recordedSets.find(
    (s) => s.setIndex === setIndex
  );

  if (!set || !set.reps || set.reps.length === 0) return;

  // demoReps -> from state, use for testing
  set.reps.forEach((rep) => {
    const biggest = Math.max(
      rep.timeToExtremeMs ?? 0,
      rep.timeAtExtremeMs ?? 0,
      rep.timeFromExtremeToEndMs ?? 0
    );
    if (biggest > maxValueRef.current) maxValueRef.current = biggest;
  });

  const rows = set.reps.map((r) => {
    return {
      id: r.repNumber,
      label: `${r.repNumber}`,
      concentric:
        r.timeFromExtremeToEndMs !== undefined
          ? -1 * (r.timeFromExtremeToEndMs / 1000)
          : 0,
      eccentric: (r.timeToExtremeMs || 0) / 1000,
      isometric: (r.timeAtExtremeMs || 0) / 1000,
    };
  });

  return (
    <BarChart
      dataset={rows}
      xAxis={[{ scaleType: 'band', dataKey: 'label' }]}
      yAxis={[
        {
          min: -1 * (maxValueRef.current / 1000),
          max: 1 * (maxValueRef.current / 1000),
          label: 'Time (s)',
        },
      ]}
      borderRadius={8}
      margin={{ right: 0, bottom: 0, left: 0 }}
      series={[
        {
          dataKey: 'eccentric',
          label: 'Eccentric',
          stack: 'time',
          valueFormatter: (v) => {
            if (!v) return '0 (0%)';

            return `${Math.abs(v).toFixed(2)} (${Math.round(Math.abs(v) * 100)}%)`;
          },
          color: theme.palette.primary.main,
        },
        {
          dataKey: 'concentric',
          label: 'Concentric',
          stack: 'time',
          valueFormatter: (v, ctx) => {
            if (!v) return '0 (0%)';

            return `${Math.abs(v).toFixed(2)} (${Math.round(Math.abs(v) * 100)}%)`;
          },
          color: theme.palette.secondary.main,
          // MUI X Charts uses current theme palette by default.
          // We'll set a warm orange for concentric.
        },
      ]}
      width={width}
      height={300}
      sx={{
        // center axis at 0 with a dashed line
        transform: 'translateX(-15px)', // 👈 to the left to compensate for y-axis label
        [`& .${axisClasses.bottom} .${axisClasses.line}`]: {
          display: 'none',
        },
        [`& .${axisClasses.left} .${axisClasses.label}`]: {
          transform: 'translateX(15px)', // 👈 optional: move label closer
        },
        '& .MuiChartsLegend-root': {
          transform: 'translateX(15px)', // 👈 to the left to compensate for y-axis label
        },
      }}
    >
      {/* zero baseline */}
      <ChartsReferenceLine
        y={0}
        lineStyle={{ strokeDasharray: '4 4', strokeWidth: 2, opacity: 0.7 }}
      />
      <IsoOverlay reps={set.reps} />
    </BarChart>
  );
}
