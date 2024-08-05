'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import TrainingDay from '@/component/training-day';
import { useState } from 'react';
import { PageProps } from '../page-props.type';
import { formatDate, getToday, getWeekDays, isSameDay } from '@/util/date';
import Typography from '@mui/material/Typography';

export default function TrainerPage(props: PageProps) {
  // context
  const { cycle, trainings, setTrainings, date, setDate } = props;
  const { group } = cycle;

  // state
  const [day, setDay] = useState(getToday());

  return <Box>
    {/* Week day badges */}
    <Stack direction="row" justifyContent="center" mt={2} spacing={1}>
      {getWeekDays().map(({ label, date }, i) => (
        <Stack direction="column" key={i} spacing={1}>
          <Avatar
            sx={{
              cursor: 'pointer',
              bgcolor: isSameDay(day.date, date) ? 'primary.main' : 'transparent',
              border: 1,
              color: 'lightgray',
            }}
            onClick={() => {
              setDay({ label, date });
              setDate({
                startDate: date.startOf('day'),
                endDate: date.endOf('day'),
                isCustom: true,
              });
            }}
          >
            {label[0]}
          </Avatar>

          <Typography variant="caption">
            {formatDate(date, { withYear: false })}
          </Typography>
        </Stack>
      ))}
    </Stack>

    {/* Group Member Avatars */}
    <Stack direction="row" spacing={1} border={1} p={2} borderRadius={5} my={4}>
      {group?.members?.map((member) => <Box key={member.uid}>
        <Avatar>{member.email[0].toUpperCase()}</Avatar>
      </Box>)}
    </Stack>

    {/* Training Set Groups With Set Exercises */}
    <TrainingDay trainings={trainings} setTrainings={setTrainings} />
  </Box>;
}