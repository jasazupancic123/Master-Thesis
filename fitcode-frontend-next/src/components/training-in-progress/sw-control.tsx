import { Box, Typography } from '@mui/material';
import { ChartsTooltip, PieChart } from '@mui/x-charts';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

import { ElapsedTime } from './training-in-progress-elapsed-time';
import { theme } from '@/app/style';
import { useTraining } from '@/store/training.provider';
import { PieCenterLabel } from '@/ui/mui-charts';
import { useTrainingInProgress } from '@/store/training-in-progress.provider';
import { STRING_CONST } from '@/lib/common/const/string.const';

interface Props {
  startOfTraining: Dayjs;
}

export default function SWControl(props: Props) {
  const { startOfTraining } = props;

  const { trainingInProgress } = useTraining();

  const { setIndex, selectedExercise } = useTrainingInProgress();

  const [now, setNow] = useState(() => Date.now());

  // const [countdownTimer, setCountdownTimer] = useState<string>(
  //   (lastSetRecTimeS || 60).toString()
  // );

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const exerciseTracking = trainingInProgress?.exerciseSetTrackingState.find(
    (est) => est.exerciseId === selectedExercise?.id
  );

  const isSetCompleted = exerciseTracking?.completedSetNumbers.some(
    (csn) => csn.setNumber === (setIndex || 0) + 1
  );

  const lastCompletedSet = exerciseTracking?.completedSetNumbers.sort(
    (a, b) => dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf()
  )[0];

  const lastSetCompletedAt = lastCompletedSet?.timestamp;

  const elapsedSinceLastSet = useMemo(() => {
    return lastSetCompletedAt === undefined
      ? 0
      : Math.max(
          0,
          Math.floor(dayjs(now).diff(dayjs(lastSetCompletedAt), 'second'))
        );
  }, [now, lastSetCompletedAt, trainingInProgress]);

  if (setIndex === undefined || !selectedExercise) return null;

  const lastSetRecTimeS = selectedExercise.sets[setIndex].recTime;

  const remaining =
    lastSetRecTimeS === undefined
      ? 0
      : Math.max(0, lastSetRecTimeS - elapsedSinceLastSet);
  const label = remaining > 0 ? `${remaining}s` : STRING_CONST.doIt;

  const width =
    typeof window !== 'undefined'
      ? Math.min(window.innerWidth * 0.95, 620)
      : 620;

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
    >
      <Typography fontWeight={600} fontSize={14} sx={{ py: 1 }}>
        Training duration:{' '}
        <ElapsedTime startMs={dayjs(startOfTraining).valueOf()} />
      </Typography>

      {/* <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
        <TextField
          label="Recovery (s)"
          value={countdownTimer}
          inputMode="numeric"
          sx={{
            width: 100,
            '& .MuiInputBase-input': {
              textAlign: 'center',
              p: 1,
            },
          }}
          onChange={(e) => {
            const v = e.target.value;
            if (/^\d*$/.test(v)) {
              setCountdownTimer(v);
            }
          }}
        />
        <Button
          variant="contained"
          sx={{ height: '100%' }}
          onClick={() => {
            const parsedNumber = parseInt(countdownTimer, 10);

            if (isNaN(parsedNumber) || parsedNumber < 0) return;

            setTrainingInProgress((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                lastSetRecTimeS: parsedNumber,
                lastSetCompletedAt: new Date(),
              };
            });
          }}
        >
          Set
        </Button>
      </Box> */}

      {lastSetCompletedAt !== undefined &&
        lastSetRecTimeS !== undefined &&
        lastCompletedSet &&
        lastCompletedSet.setNumber != setIndex + 1 &&
        !isSetCompleted && (
          <>
            <PieChart
              height={120}
              width={width}
              hideLegend
              series={[
                {
                  data: [
                    {
                      value:
                        label === STRING_CONST.doIt ? 100 : elapsedSinceLastSet,
                      label: '',
                    },
                    {
                      value: label === STRING_CONST.doIt ? 0 : remaining,
                      label: '',
                    },
                  ],
                  innerRadius: 45,
                },
              ]}
              colors={[
                theme.palette.primary.main,
                theme.palette.background.light,
              ]}
            >
              <ChartsTooltip trigger="none" />
              <PieCenterLabel label={label} />
            </PieChart>
            <Typography fontWeight={600} fontSize={14}>
              Recovery time
            </Typography>
          </>
        )}

      {/* <Button
        variant="contained"
        sx={{ height: '100%' }}
        onClick={() => {
          setTrainingInProgress((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              lastSetRecTimeS: 0,
              lastSetCompletedAt: new Date(),
            };
          });
        }}
      >
        Clear
      </Button> */}
    </Box>
  );
}
