import React, { Fragment, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { Training } from '@/training/entity/training.entity';
import Stack from '@mui/material/Stack';
import Circles from '@/app/groups/components/circles';
import { GroupPageProps } from '@/group/type/props.type';
import { CommonService } from '@/common/service/common.service';

const commonService = CommonService.instance;

export default function TrainerWeekView(props: GroupPageProps) {
  const [index, setIndex] = useState(0); // week index
  const cycle = props.selected.cycle;
  const weeks = cycle?.weeks || [commonService.date.getWeekDays()];
  const trainings = cycle?.trainings || [];

  const getWeek = (index: number) => weeks[index];
  const getWeekStart = (index: number) => dayjs(weeks[index][0].date)!.startOf('day');
  const getWeekEnd = (index: number) => dayjs(weeks[index][6].date)!.endOf('day');

  /**
   * Set date to cycle start and end when opening the page
   */
  useEffect(() => {
    if (!cycle) return;
    setIndex(0);
  }, [cycle?.id]);

  /**
   * Set date range when week index changes
   */
  useEffect(() => {
    props.setDate({
      start: getWeekStart(index),
      end: getWeekEnd(index),
      custom: index !== 0,
    });
  }, [index]);

  if (!cycle)
    return <Typography variant="body1" mt={2}>No cycle selected</Typography>;

  return <Box>
    {/* Week selector */}
    <Circles
      items={weeks.map((_, i) => ({ label: `W${i + 1}`, value: i.toString() }))}
      value={index.toString()}
      setValue={(value) => setIndex(parseInt(value))}
    />

    {/* Trainings */}
    <Box p={2}>
      <Grid container spacing={2} display="flex" justifyContent="space-between">
        {getWeek(index)?.map(({ date }, i) => {
          const day = dayjs(date);
          const filtered = trainings.filter((t) => commonService.date.isBetween(day, dayjs(t.from), dayjs(t.to)));

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
            <Typography sx={{ color: '#fff' }}>{commonService.date.format(day)}</Typography>

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
    start: dayjs(training.from).format('HH:mm'),
    end: dayjs(training.to).format('HH:mm'),
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

      {training.components.map((c) => (
        <Box key={c.componentId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography sx={{ color: '#fff', textAlign: 'left', flexBasis: '66.67%' }}>{c.component?.name}</Typography>
        </Box>
      ))}
    </Box>
  </Box>;
}