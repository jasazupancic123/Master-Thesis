import { Typography } from '@mui/material';

import type { TrainingExerciseRecordedSet } from '@/core/training/type/training-exercise.type';

interface Props {
  completedSet: TrainingExerciseRecordedSet;
}

export default function RomStatistic({ completedSet }: Props) {
  // Make comparison statisctic between L and R
  if (
    completedSet.repsL &&
    completedSet.repsR &&
    completedSet.repsL.length &&
    completedSet.repsR.length
  ) {
    const maxDiffsRomL = completedSet.repsL
      .map((rep) =>
        rep.startRomValue !== undefined && rep.extremumRomValue !== undefined
          ? Math.abs(rep.startRomValue - rep.extremumRomValue)
          : undefined
      )
      .filter((val) => val !== undefined);

    const maxDiffsRomR = completedSet.repsR
      .map((rep) =>
        rep.startRomValue !== undefined && rep.extremumRomValue !== undefined
          ? Math.abs(rep.startRomValue - rep.extremumRomValue)
          : undefined
      )
      .filter((val) => val !== undefined);

    const avgDiffRomL =
      maxDiffsRomL.reduce((a, b) => (b ? a + b : a), 0) / maxDiffsRomL.length;

    const avgDiffRomR =
      maxDiffsRomR.reduce((a, b) => (b ? a + b : a), 0) / maxDiffsRomR.length;

    const smaller: 'Left' | 'Right' =
      avgDiffRomL < avgDiffRomR ? 'Left' : 'Right';
    const bigger: 'Left' | 'Right' = smaller === 'Left' ? 'Right' : 'Left';

    const smallerRom = smaller === 'Left' ? avgDiffRomL : avgDiffRomR;
    const biggerRom = smaller === 'Left' ? avgDiffRomR : avgDiffRomL;

    const percentDiff = Math.abs(((smallerRom - biggerRom) / biggerRom) * 100);

    const romLString = completedSet.repsL
      .map((r) => `Rep ${r.repNumber}: ${r.totalRomCm?.toFixed(2)}cm`)
      .join(', ');
    const romRString = (completedSet.repsR || [])
      .map((r) => `Rep ${r.repNumber}: ${r.totalRomCm?.toFixed(2)}cm`)
      .join(', ');

    const avgTotalRomL =
      completedSet.repsL
        .map((r) => r.totalRomCm || 0)
        .reduce((a, b) => a + b, 0) / completedSet.repsL.length;

    const avgTotalRomR =
      (completedSet.repsR || [])
        .map((r) => r.totalRomCm || 0)
        .reduce((a, b) => a + b, 0) /
      (completedSet.repsR ? completedSet.repsR.length : 1);

    return (
      <Typography
        textAlign="center"
        width="100%"
        sx={{
          mx: 'auto',
          px: 1,
        }}
      >
        {!isNaN(percentDiff) && isFinite(percentDiff) && (
          <>
            {bigger} side ROM is {percentDiff.toFixed(2)}% bigger compared to{' '}
            {smaller} side ROM
          </>
        )}
        <br />
        Left ROMs: {romLString}
        <br />
        Right ROMs: {romRString}
        <br />
        Average Left total ROM: {avgTotalRomL.toFixed(2)}cm
        <br />
        Average Right total ROM: {avgTotalRomR.toFixed(2)}cm
      </Typography>
    );
  }

  // Make statistic for the only present side
  const currentReps = completedSet.repsL || completedSet.repsR;

  if (!currentReps) return null;
  // if (!currentReps || currentReps.length < 3) return null;

  const diffs = currentReps
    .slice(1, currentReps.length - 1) // skip first rep as it might be inaccurate
    .map((rep) =>
      rep.startRomValue !== undefined && rep.extremumRomValue !== undefined
        ? Math.abs(rep.startRomValue - rep.extremumRomValue)
        : undefined
    )
    .filter((val) => val !== undefined);

  // if (diffs.length < 2) return null;

  const maxDiff = Math.max(...(diffs as number[]));
  const minDiff = Math.min(...(diffs as number[]));

  const percentDiff = Math.abs(((minDiff - maxDiff) / maxDiff) * 100);

  const romLString = completedSet.repsL
    .map((r) => `Rep ${r.repNumber}: ${r.totalRomCm?.toFixed(2)}cm`)
    .join(', ');
  const romRString = (completedSet.repsR || [])
    .map((r) => `Rep ${r.repNumber}: ${r.totalRomCm?.toFixed(2)}cm`)
    .join(', ');

  const avgTotalRomL =
    completedSet.repsL
      .map((r) => r.totalRomCm || 0)
      .reduce((a, b) => a + b, 0) / completedSet.repsL.length;

  const avgTotalRomR =
    (completedSet.repsR || [])
      .map((r) => r.totalRomCm || 0)
      .reduce((a, b) => a + b, 0) /
    (completedSet.repsR ? completedSet.repsR.length : 1);

  // if (isNaN(percentDiff) || !isFinite(percentDiff)) return null;

  return (
    <Typography
      textAlign="center"
      width="100%"
      sx={{
        mx: 'auto',
        px: 1,
      }}
    >
      {!isNaN(percentDiff) && isFinite(percentDiff) && (
        <>
          Biggest rep ROM is {percentDiff.toFixed(0)}% bigger compared to
          smallest rep ROM
        </>
      )}
      <br />
      Left ROMs: {romLString}
      <br />
      Right ROMs: {romRString}
      <br />
      Average Left total ROM: {avgTotalRomL.toFixed(2)}cm
      <br />
      Average Right total ROM: {avgTotalRomR.toFixed(2)}cm
    </Typography>
  );
}
