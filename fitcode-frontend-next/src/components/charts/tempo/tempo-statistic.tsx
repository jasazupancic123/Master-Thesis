import { Typography } from '@mui/material';

import type { TrainingExerciseRecording } from '@/core/training/type/training-exercise.type';

interface TempoStatisticProps {
  selectedExercise: TrainingExerciseRecording;
  setIndex: number;
}

export default function TempoStatistic(props: TempoStatisticProps) {
  const { selectedExercise, setIndex } = props;

  const currentSet = selectedExercise.recordedSets?.find(
    (s) => s.setIndex === setIndex
  );

  if (!currentSet) return null;

  if (!currentSet.repsL.length && !currentSet.repsR?.length) return null;

  // Make comparison statisctic between L and R
  if (
    currentSet.repsL &&
    currentSet.repsR &&
    currentSet.repsL.length &&
    currentSet.repsR.length
  ) {
    const totalRepTimesL = currentSet.repsL
      .map((rep) =>
        rep.endTimestamp
          ? new Date(rep.endTimestamp).getTime() -
            new Date(rep.startTimestamp).getTime()
          : undefined
      )
      .filter((val) => val !== undefined);

    const totalRepTimesR = currentSet.repsR
      .map((rep) =>
        rep.endTimestamp
          ? new Date(rep.endTimestamp).getTime() -
            new Date(rep.startTimestamp).getTime()
          : undefined
      )
      .filter((val) => val !== undefined);

    if (totalRepTimesL.length === 0 || totalRepTimesR.length === 0) return null;

    const avgTotalRepTimeL =
      totalRepTimesL.reduce((a, b) => (b ? a + b : a), 0) /
      totalRepTimesL.length;

    const avgTotalRepTimeR =
      totalRepTimesR.reduce((a, b) => (b ? a + b : a), 0) /
      totalRepTimesR.length;

    const slower: 'Left' | 'Right' =
      avgTotalRepTimeL > avgTotalRepTimeR ? 'Left' : 'Right';
    const faster: 'Left' | 'Right' = slower === 'Left' ? 'Right' : 'Left';

    const slowerTempo = slower === 'Left' ? avgTotalRepTimeL : avgTotalRepTimeR;
    const fasterTempo = slower === 'Left' ? avgTotalRepTimeR : avgTotalRepTimeL;

    const percentDiff = Math.abs(
      ((fasterTempo - slowerTempo) / slowerTempo) * 100
    );

    return (
      <Typography
        textAlign="center"
        width="100%"
        sx={{
          mx: 'auto',
          px: 1,
        }}
      >
        {faster} side tempo is {percentDiff.toFixed(2)}% faster compared to{' '}
        {slower} side tempo
      </Typography>
    );
  }

  // Make statistic for the only present side
  const currentReps = currentSet.repsL || currentSet.repsR;

  if (!currentReps || currentReps.length < 2) return null;

  const totalRepTimes = currentReps
    .map((rep) =>
      rep.endTimestamp
        ? new Date(rep.endTimestamp).getTime() -
          new Date(rep.startTimestamp).getTime()
        : undefined
    )
    .filter((val) => val !== undefined);

  if (totalRepTimes.length < 2) return null;

  const min = Math.min(...(totalRepTimes as number[]));
  const max = Math.max(...(totalRepTimes as number[]));

  const percentDiff = Math.abs(((min - max) / max) * 100);

  return (
    <Typography
      textAlign="center"
      width="100%"
      sx={{
        mx: 'auto',
        px: 1,
      }}
    >
      Fastest rep tempo is {percentDiff.toFixed(2)}% faster compared to slowest
      rep tempo
    </Typography>
  );
}
