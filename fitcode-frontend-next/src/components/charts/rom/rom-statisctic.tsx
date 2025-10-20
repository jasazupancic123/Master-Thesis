import { TrainingExerciseRecording } from '@/controller/training/type/training-exercise.type';
import { Typography } from '@mui/material';

interface RomStatisticProps {
  selectedExercise: TrainingExerciseRecording;
  setIndex: number;
}

export default function RomStatistic(props: RomStatisticProps) {
  const { selectedExercise, setIndex } = props;

  const currentSet = selectedExercise.recordedSets?.find(
    (s) => s.setIndex === setIndex
  );

  if (!currentSet) return null;

  if (!currentSet.romL && !currentSet.romR) return null;

  // Make comparison statisctic between L and R
  if (
    currentSet.repsL &&
    currentSet.repsR &&
    currentSet.repsL.length &&
    currentSet.repsR.length
  ) {
    const maxDiffsRomL = currentSet.repsL
      .map((rep) =>
        rep.startRomValue !== undefined && rep.extremumRomValue !== undefined
          ? Math.abs(rep.startRomValue - rep.extremumRomValue)
          : undefined
      )
      .filter((val) => val !== undefined);

    const maxDiffsRomR = currentSet.repsR
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

    if (isNaN(percentDiff) || !isFinite(percentDiff)) return null;

    return (
      <Typography
        textAlign="center"
        width="100%"
        sx={{
          mx: 'auto',
          px: 1,
        }}
      >
        {bigger} side ROM is {percentDiff.toFixed(2)}% bigger compared to{' '}
        {smaller} side ROM
      </Typography>
    );
  }

  // Make statistic for the only present side
  const currentReps = currentSet.repsL || currentSet.repsR;

  if (!currentReps || currentReps.length < 3) return null;

  const diffs = currentReps
    .slice(1, currentReps.length - 1) // skip first rep as it might be inaccurate
    .map((rep) =>
      rep.startRomValue !== undefined && rep.extremumRomValue !== undefined
        ? Math.abs(rep.startRomValue - rep.extremumRomValue)
        : undefined
    )
    .filter((val) => val !== undefined);

  if (diffs.length < 2) return null;

  const maxDiff = Math.max(...(diffs as number[]));
  const minDiff = Math.min(...(diffs as number[]));

  const percentDiff = Math.abs(((minDiff - maxDiff) / maxDiff) * 100);

  if (isNaN(percentDiff) || !isFinite(percentDiff)) return null;

  return (
    <Typography
      textAlign="center"
      width="100%"
      sx={{
        mx: 'auto',
        px: 1,
      }}
    >
      Biggest rep ROM is {percentDiff.toFixed(0)}% bigger compared to smallest
      rep ROM
    </Typography>
  );
}
