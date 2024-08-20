import { GroupPageProps } from '@/app/groups/props';
import { AppContextType, useAppContext } from '@/context/app-provider';
import React, { Fragment, useEffect, useState } from 'react';
import { formatDate, getWeekDays, isDateBetween } from '@/util/date';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { Training } from '@/type/training.type';
import { Firestore } from '@/util/firebase';
import Stack from '@mui/material/Stack';
import Circles from '@/app/groups/components/circles';

export default function TrainerWeekView(props: GroupPageProps) {
  // context
  const { token, components } = useAppContext() as AppContextType;
  const [index, setIndex] = useState(0); // week index

  const weeks = props.selected.cycle?.weeks || [getWeekDays()];
  const trainings = (props.selected.trainings || []).map((training) => Firestore.populateTraining(training, components.flat));

  const getWeek = (index: number) => weeks[index];
  const getWeekStart = (index: number) => dayjs(weeks[index][0].date)!.startOf('day');
  const getWeekEnd = (index: number) => dayjs(weeks[index][6].date)!.endOf('day');

  useEffect(() => {
    props.setDate({
      start: getWeekStart(index),
      end: getWeekEnd(index),
      custom: true,
    });
  }, [index]);

  if (!props.selected.cycle)
    return <Typography variant="body1">No cycle selected</Typography>;

  return <Box>
    {/* Week selector */}
    <Circles
      items={weeks.map((week, i) => ({ label: `W${i + 1}`, value: i.toString() }))}
      value={index.toString()}
      setValue={(value) => setIndex(parseInt(value))}
    />

    {/* Trainings */}
    <Box p={2}>
      <Grid container spacing={2} display="flex" justifyContent="space-between">
        {getWeek(index).map(({ date }, i) => {
          const day = dayjs(date);
          const filtered = trainings.filter((t) => isDateBetween(day, dayjs(t.startTime), dayjs(t.endTime)));

          return <Grid
            key={i}
            xs={12 / 7}
            sx={{
              padding: '8px',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography sx={{ color: '#fff' }}>{formatDate(day)}</Typography>

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {filtered.map((training) => (
                <Fragment key={training.id}>
                  <TrainingItem training={training} />
                </Fragment>
              ))}
            </Box>
          </Grid>;
        })}
      </Grid>
    </Box>
  </Box>;
}

function TrainingItem(props: { training: Training }) {
  const { training } = props;
  const [date, setDate] = useState(() => ({
    start: dayjs(training.startTime).format('HH:mm'),
    end: dayjs(training.endTime).format('HH:mm'),
  }));

  return <Box>
    {/* Training components */}
    <Box sx={{ flex: 1, p: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)', display: 'flex', flexDirection: 'column' }}>
      <Stack spacing={1}>
        <input
          type="time"
          value={date.start}
          onChange={(e) => setDate({ ...date, start: e.target.value })}
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
          value={date.end}
          onChange={(e) => setDate({ ...date, end: e.target.value })}
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

      {training.setGroups.map((set) => (
        <Box key={set.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography sx={{ color: '#fff', textAlign: 'left', flexBasis: '66.67%' }}>{set.component?.name}</Typography>
        </Box>
      ))}
    </Box>
  </Box>;
}