/* eslint-disable @typescript-eslint/no-explicit-any */

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
import type { TrainingExerciseRecording } from '@/core/training/type/training-exercise.type';
import { EXERCISE_POSES } from '@/lib/pose-detection/const/exercise-poses';
import { ConditionDirection } from '@/lib/pose-detection/enum/condition-detection.enum';
import type {
  ExerciseDetectionData,
  ExerciseDetectionDataWithExerciseIds,
} from '@/lib/pose-detection/type/exercise-start-condition.type';
import type {
  RecordedReps,
  RecordedRepsInfo,
} from '@/lib/pose-detection/type/rep.type';

function IsoOverlayDual({
  rows,
}: {
  rows: { label: string; isometricL?: number; isometricR?: number }[];
}) {
  const xScale = useXScale(); // band scale
  const yScale = useYScale(); // linear scale [-1, 1]

  const y0 = yScale(0);
  const hasBandwidth = typeof (xScale as any).bandwidth === 'function';

  if (!hasBandwidth) return null;

  const bw = (xScale as any).bandwidth();

  return (
    <g pointerEvents="none">
      {rows.map((r) => {
        const xBase = (xScale as any)(r.label);
        if (xBase === null) return null;

        // Centers for L then R:

        const isoVals = [r.isometricL, r.isometricR].filter(
          (v) => v !== undefined
        ) as number[];

        const groupCount = isoVals.length;
        const groupWidth = bw / groupCount;

        const centers =
          groupCount === 1
            ? [xBase + groupWidth * (r.isometricL !== undefined ? 0.25 : 0.75)]
            : [xBase + groupWidth * 0.5, xBase + groupWidth * 1.5];

        return (
          <g key={r.label}>
            {isoVals.map((val, idx) => {
              if (!val) return null;
              const xCenter = centers[idx];
              const yIso = yScale(val);

              // keep your two-layer line; you can tweak stroke for R if you want
              const outerColor = theme.palette.background.lightBorder;
              const innerColor = theme.palette.background.default;

              if (isNaN(xCenter) || !yIso) return null;

              return (
                <g key={`${r.label}-${idx}`}>
                  <line
                    x1={xCenter}
                    x2={xCenter}
                    y1={y0}
                    y2={yIso}
                    stroke={outerColor}
                    strokeWidth={rows.length > 6 ? 2 : 4}
                    strokeLinecap="round"
                  />
                  <line
                    x1={xCenter}
                    x2={xCenter}
                    y1={y0}
                    y2={yIso}
                    stroke={innerColor}
                    strokeWidth={rows.length > 6 ? 1 : 2}
                    strokeLinecap="round"
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

interface Props {
  selectedExercise: TrainingExerciseRecording | undefined;
  setIndex: number;
  width: number;
  height?: number;
  passedReps?: RecordedReps;
  passedExercisePose?: ExerciseDetectionData;
  isUnilateral: boolean;
  hideLabels?: boolean;
  sx?: SxProps;
  aiRecordingView?: boolean;
}

export default function TempoChart({
  selectedExercise,
  setIndex,
  width,
  height = 300,
  passedReps,
  passedExercisePose,
  isUnilateral,
  hideLabels = false,
  sx,
  aiRecordingView,
}: Props) {
  const maxValueRef = useRef(0);

  const currentRepsRef = useRef<RecordedRepsInfo | null>(passedReps || null);

  if (!selectedExercise?.recordedSets && !passedReps) return null;

  const exercisePose: ExerciseDetectionDataWithExerciseIds | undefined =
    selectedExercise
      ? EXERCISE_POSES.find((e) => e.exerciseIds.includes(selectedExercise.id))
      : undefined;

  if (!passedReps) {
    if (selectedExercise && selectedExercise.recordedSets) {
      const set = selectedExercise.recordedSets.find(
        (s) => s.setIndex === setIndex
      );

      if (set) {
        currentRepsRef.current = { left: set.repsL, right: set.repsR };
      } else currentRepsRef.current = null;
    }
  }

  if (!currentRepsRef.current) return null;

  const sides = [
    currentRepsRef.current.left,
    currentRepsRef.current.right,
  ].filter((s) => s !== undefined);

  // demoReps -> from state, use for testing
  sides.forEach((side) => {
    side.forEach((rep) => {
      const biggest = Math.max(
        rep.timeToExtremeMs ?? 0,
        rep.timeAtExtremeMs ?? 0,
        rep.timeFromExtremeToEndMs ?? 0
      );
      if (biggest > maxValueRef.current) maxValueRef.current = biggest;
    });
  });

  let sideWithMoreReps: 'L' | 'R' = 'L';

  if (
    currentRepsRef.current.right !== undefined &&
    currentRepsRef.current.right.length > currentRepsRef.current.left.length
  )
    sideWithMoreReps = 'R';
  else if (!currentRepsRef.current.left && currentRepsRef.current.right)
    sideWithMoreReps = 'R';

  const mainSide =
    sideWithMoreReps === 'L'
      ? currentRepsRef.current.left
      : currentRepsRef.current.right;

  if (!mainSide) return null;

  const rows = mainSide.map((r, repIndex) => {
    const row: {
      id?: number;
      label?: string;
      concentricL?: number;
      eccentricL?: number;
      isometricL?: number;
      isometricFakeL?: number;
      concentricR?: number;
      eccentricR?: number;
      isometricR?: number;
      isometricFakeR?: number;
    } = {};

    if (!row.id) row.id = r.repNumber;
    if (!row.label) row.label = `${r.repNumber}`;

    const secondarySide =
      sideWithMoreReps === 'L'
        ? currentRepsRef.current?.right
        : currentRepsRef.current?.left;

    const secondarySideRep = secondarySide ? secondarySide[repIndex] : null;

    const directionLeft = exercisePose
      ? exercisePose.data.leftSide.conditions[0].direction
      : passedExercisePose
        ? passedExercisePose.leftSide.conditions[0].direction
        : null;

    const directionRight = exercisePose
      ? exercisePose.data.rightSide?.conditions[0].direction
      : passedExercisePose
        ? passedExercisePose.rightSide?.conditions[0].direction
        : null;

    if (sideWithMoreReps === 'L') {
      // left

      if (directionLeft === ConditionDirection.POSITIVE) {
        ((row.concentricL = (r.timeToExtremeMs || 0) / 1000),
          (row.eccentricL =
            r.timeFromExtremeToEndMs !== undefined
              ? (-1 * r.timeFromExtremeToEndMs) / 1000
              : 0));
        row.isometricL = (r.timeAtExtremeMs || 0) / 1000;
        row.isometricFakeL = 0;
      } else {
        row.concentricL =
          r.timeFromExtremeToEndMs !== undefined
            ? r.timeFromExtremeToEndMs / 1000
            : 0;
        row.eccentricL = (-1 * (r.timeToExtremeMs || 0)) / 1000;
        row.isometricL = (r.timeAtExtremeMs || 0) / 1000;
        row.isometricFakeL = 0;
      }

      if (secondarySideRep) {
        // update right side
        if (directionRight === ConditionDirection.POSITIVE) {
          ((row.concentricR = (secondarySideRep.timeToExtremeMs || 0) / 1000),
            (row.eccentricR =
              secondarySideRep.timeFromExtremeToEndMs !== undefined
                ? (-1 * secondarySideRep.timeFromExtremeToEndMs) / 1000
                : 0));
          row.isometricR = (secondarySideRep.timeAtExtremeMs || 0) / 1000;
          row.isometricFakeR = 0;
        } else {
          row.concentricR =
            secondarySideRep.timeFromExtremeToEndMs !== undefined
              ? secondarySideRep.timeFromExtremeToEndMs / 1000
              : 0;
          row.eccentricR =
            (-1 * (secondarySideRep.timeToExtremeMs || 0)) / 1000;
          row.isometricR = (secondarySideRep.timeAtExtremeMs || 0) / 1000;
          row.isometricFakeR = 0;
        }
      }
    } else {
      // right
      if (directionRight === ConditionDirection.POSITIVE) {
        ((row.concentricR = (r.timeToExtremeMs || 0) / 1000),
          (row.eccentricR =
            r.timeFromExtremeToEndMs !== undefined
              ? (-1 * r.timeFromExtremeToEndMs) / 1000
              : 0));
        row.isometricR = (r.timeAtExtremeMs || 0) / 1000;
        row.isometricFakeR = 0;
      } else {
        row.concentricR =
          r.timeFromExtremeToEndMs !== undefined
            ? r.timeFromExtremeToEndMs / 1000
            : 0;
        row.eccentricR = (-1 * (r.timeToExtremeMs || 0)) / 1000;
        row.isometricR = (r.timeAtExtremeMs || 0) / 1000;
        row.isometricFakeR = 0;
      }

      if (secondarySideRep) {
        // update left side
        if (directionLeft === ConditionDirection.POSITIVE) {
          ((row.concentricL = (secondarySideRep.timeToExtremeMs || 0) / 1000),
            (row.eccentricL =
              secondarySideRep.timeFromExtremeToEndMs !== undefined
                ? (-1 * secondarySideRep.timeFromExtremeToEndMs) / 1000
                : 0));
          row.isometricL = (secondarySideRep.timeAtExtremeMs || 0) / 1000;
          row.isometricFakeL = 0;
        } else {
          row.concentricL =
            secondarySideRep.timeFromExtremeToEndMs !== undefined
              ? secondarySideRep.timeFromExtremeToEndMs / 1000
              : 0;
          row.eccentricL =
            (-1 * (secondarySideRep.timeToExtremeMs || 0)) / 1000;
          row.isometricL = (secondarySideRep.timeAtExtremeMs || 0) / 1000;
          row.isometricFakeL = 0;
        }
      }
    }

    return row;
  });

  return (
    <BarChart
      width={width}
      height={height}
      dataset={rows}
      hideLegend={hideLabels}
      xAxis={[
        {
          scaleType: 'band',
          dataKey: 'label',
          disableLine: hideLabels,
          disableTicks: hideLabels,
          tickLabelStyle: { display: hideLabels ? 'none' : 'block' },
          barGapRatio: 0,
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
      series={
        isUnilateral
          ? [
              // LEFT stack (keeps your current color scheme)
              {
                dataKey: 'concentricL',
                label: 'Con (L)',
                stack: 'timeL',
                valueFormatter: (v) =>
                  !v ? '–' : `Coc (L): ${Math.abs(v).toFixed(1)}s`,
                color: theme.palette.primary.main,
              },
              {
                dataKey: 'eccentricL',
                label: 'Ecc (L)',
                stack: 'timeL',
                valueFormatter: (v) =>
                  !v ? '–' : `Ecc (L): ${Math.abs(v).toFixed(1)}s`,
                color: theme.palette.secondary.main,
              },
              {
                // zero-height (transparent) segment so the tooltip can show the isometric value
                dataKey: 'isometricFakeL',
                label: 'Iso (L)',
                stack: 'timeL',
                valueFormatter: (v, ctx) => {
                  const row = rows[ctx.dataIndex];
                  const iso = row?.isometricL ?? 0;
                  return iso
                    ? `Iso (L): ${Math.abs(iso).toFixed(1)}s`
                    : 'Iso (L): –';
                },
                color: 'none',
              },
              {
                dataKey: 'concentricR',
                label: 'Con (R)',
                stack: 'timeR',
                valueFormatter: (v) =>
                  !v ? '–' : `Con (R): ${Math.abs(v).toFixed(1)}s`,
                color: theme.palette.info.main,
              },
              {
                dataKey: 'eccentricR',
                label: 'Ecc (R)',
                stack: 'timeR',
                valueFormatter: (v) =>
                  !v ? '–' : `Ecc (R): ${Math.abs(v).toFixed(1)}s`,
                color: theme.palette.info.light,
              },
              {
                dataKey: 'isometricFakeR',
                label: 'Iso (R)',
                stack: 'timeR',
                valueFormatter: (v, ctx) => {
                  const row = rows[ctx.dataIndex];
                  const iso = row?.isometricR ?? 0;
                  return iso
                    ? `Iso (R): ${Math.abs(iso).toFixed(1)}s`
                    : 'Iso (R): –';
                },
                color: 'none',
              },
            ]
          : [
              {
                dataKey: 'concentricL',
                label: 'Con',
                stack: 'timeL',
                valueFormatter: (v) =>
                  !v ? '–' : `Con: ${Math.abs(v).toFixed(1)}s`,
                color: theme.palette.primary.main,
              },
              {
                dataKey: 'eccentricL',
                label: 'Ecc',
                stack: 'timeL',
                valueFormatter: (v) =>
                  !v ? '–' : `Ecc: ${Math.abs(v).toFixed(1)}s`,
                color: theme.palette.secondary.main,
              },
              {
                // zero-height (transparent) segment so the tooltip can show the isometric value
                dataKey: 'isometricFakeL',
                label: 'Iso',
                stack: 'timeL',
                valueFormatter: (v, ctx) => {
                  const row = rows[ctx.dataIndex];
                  const iso = row?.isometricL ?? 0;
                  return iso ? `Iso: ${Math.abs(iso).toFixed(1)}s` : 'Iso: –';
                },
                color: 'none',
              },
            ]
      }
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
          justifyContent: 'center',
          gap: 0.5,
          flexWrap: 'nowrap',
          textAlign: 'center',
          fontSize: 10,
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

      {/* <IsoOverlay reps={currentRepsRef.current} /> */}
      <IsoOverlayDual
        rows={rows.map((r, index) => ({
          label: r.label || index.toString(),
          isometricL: r.isometricL,
          isometricR: r.isometricR,
        }))}
      />
    </BarChart>
  );
}
