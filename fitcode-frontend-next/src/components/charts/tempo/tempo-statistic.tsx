import { Typography } from '@mui/material';

import type { TrainingExerciseRecordedSet } from '@/core/training/type/training-exercise.type';

interface Props {
  recordedSet: TrainingExerciseRecordedSet;
}

export default function TempoStatistic({ recordedSet }: Props) {
  // Make comparison statisctic between L and R
  if (
    recordedSet.repsL &&
    recordedSet.repsR &&
    recordedSet.repsL.length &&
    recordedSet.repsR.length
  ) {
    const totalRepTimesL = recordedSet.repsL
      .map((rep) =>
        rep.endTimestamp
          ? new Date(rep.endTimestamp).getTime() -
            new Date(rep.startTimestamp).getTime()
          : undefined
      )
      .filter((val) => val !== undefined);

    const totalRepTimesR = recordedSet.repsR
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
  const currentReps = recordedSet.repsL || recordedSet.repsR;

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
