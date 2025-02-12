import { Box, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useState } from 'react';
import { TrainingWeekViewItemProps } from './type';

export default function TrainingItem(props: TrainingWeekViewItemProps) {
  const { training, updateTraining } = props;
  const [date, setDate] = useState(() => ({
    from: dayjs(training.from).format('HH:mm'),
    to: dayjs(training.to).format('HH:mm'),
  }));

  async function onChange(key: 'from' | 'to', value: string) {
    const [hours, minutes] = value.split(':');
    const date = dayjs(training.from)
      .set('hour', parseInt(hours))
      .set('minute', parseInt(minutes));

    await updateTraining(training, { [key]: date.toDate() });

    setDate((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Box>
      {/* Training components */}
      <Box
        sx={{
          flex: 1,
          p: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Stack spacing={1}>
          <input
            type="time"
            value={date.from}
            onChange={(e) => onChange('from', e.target.value)}
            style={{
              color: '#fff',
              backgroundColor: '#303E4A',
              border: 'none',
              padding: '4px',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          />

          <input
            type="time"
            value={date.to}
            onChange={(e) => onChange('to', e.target.value)}
            style={{
              color: '#fff',
              backgroundColor: '#303E4A',
              border: 'none',
              padding: '4px',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          />
        </Stack>

        {Object.values(training.components).map((c) => (
          <Box
            key={c.id}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 1,
            }}
          >
            <Typography
              sx={{ color: '#fff', textAlign: 'left', flexBasis: '66.67%' }}
            >
              {c.component?.name}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
