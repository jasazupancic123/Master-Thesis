import { Box, Button, TextField, Typography } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { ChartsTooltip, PieChart } from '@mui/x-charts';
import { PieCenterLabel } from '@/ui/mui-charts';
import { theme } from '@/app/style';
import { ElapsedTime } from './training-in-progress-elapsed-time';
import { useEffect, useMemo, useState } from 'react';
import { useTraining } from '@/store/training.provider';

interface Props {
  startOfTraining: Dayjs;
  lastSetCompletedAt: string | number | Date;
  lastSetRecTimeS: number;
}

export default function SWControl(props: Props) {
  const { startOfTraining, lastSetCompletedAt, lastSetRecTimeS } = props;

  const { trainingInProgress, setTrainingInProgress } = useTraining();

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedSinceLastSet = useMemo(() => {
    return Math.max(
      0,
      Math.floor(dayjs(now).diff(dayjs(lastSetCompletedAt), 'second'))
    );
  }, [now, lastSetCompletedAt, trainingInProgress]);

  const remaining = Math.max(0, lastSetRecTimeS - elapsedSinceLastSet);
  const label = remaining > 0 ? `${remaining}s` : 'DO IT';

  const [countdownTimer, setCountdownTimer] = useState<string>(
    (lastSetRecTimeS || 60).toString()
  );

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
      gap={1}
    >
      <Typography fontWeight={600} fontSize={14} sx={{ py: 1 }}>
        Training duration:{' '}
        <ElapsedTime startMs={dayjs(startOfTraining).valueOf()} />
      </Typography>

      <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
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
      </Box>

      <PieChart
        height={120}
        width={width}
        hideLegend
        series={[
          {
            data: [
              {
                value: label === 'DO IT' ? 100 : elapsedSinceLastSet,
                label: '',
              },
              { value: label === 'DO IT' ? 0 : remaining, label: '' },
            ],
            innerRadius: 45,
          },
        ]}
        colors={[theme.palette.primary.main, theme.palette.background.light]}
      >
        <ChartsTooltip trigger="none" />
        <PieCenterLabel label={label} />
      </PieChart>
      <Button
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
      </Button>
      <Typography fontWeight={600} fontSize={14}>
        Recovery time
      </Typography>
    </Box>
  );
}
