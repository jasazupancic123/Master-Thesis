'use client'

import Box from '@mui/material/Box';
import IconTextfield from '@/component/icon-textfield';
import ExerciseChips from '@/component/exercise-chips';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { formatDate } from '@/util/date';
import dayjs, { Dayjs } from 'dayjs';
import IconButton from '@mui/material/IconButton';
import { AddCircle } from '@mui/icons-material';
import TrainingBox from '@/app/cycles/[id]/training-box';
import { AppContextType, useAppContext } from '@/context/app-provider';
import { useState } from 'react';
import { Component } from '@/type/component.type';
import { AddSetGroup, CreateTraining, Training } from '@/type/training.type';
import toast from 'react-hot-toast';
import { fetcher } from '@/util/fetcher';
import { PageProps } from '../page-props.type';

export default function TrainerPage(props: PageProps) {
  // context
  const { token } = useAppContext() as AppContextType
  const { cycle, refetch, filter, trainings, date, setDate } = props;
  const { group, weeks } = cycle;
  const { components } = useAppContext() as AppContextType;

  // filter exercise component
  const [selected, setSelected] = useState<Component[]>([]);

  // training
  const [training, setTraining] = useState<CreateTraining>({
    startTime: dayjs(),
    endTime: dayjs().add(2, 'hour'),
    date: dayjs(),
  });

  async function createTraining(data: CreateTraining) {
    if (!selected.length) {
      toast.error('Select atleast one component')
      return
    }

    // set start time and end time to date
    const startTime = data.date
      .set('year', data.date.year())
      .set('month', data.date.month())
      .set('date', data.date.date())
      .set('hour', data.startTime.hour())
      .set('minute', data.startTime.minute())
      .set('second', data.startTime.second())

    const endTime = data.date
      .set('year', data.date.year())
      .set('month', data.date.month())
      .set('date', data.date.date())
      .set('hour', data.endTime.hour())
      .set('minute', data.endTime.minute())
      .set('second', data.endTime.second())

    try {
      await fetcher<Training>(`/training`, {
        method: 'POST',
        token,
        body: {
          cycleId: cycle.id,
          componentIds: selected.map(c => c.id),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      });

      toast.success('Training created');
      refetch();
    } catch (e) {
      toast.error(e.message || 'Failed to create training');
    }
  }

  async function addSetGroup(data: AddSetGroup) {
    try {
      for (const componentId of data.componentIds)
        await fetcher(`/training/set-group`, {
          token,
          method: 'POST',
          body: {
            trainingId: data.trainingId,
            componentId,
            order: 0,
            color: 'red'
          },
        });

      refetch();
    } catch (e) {
      toast.error(e.message || 'Failed to add set group');
    }
  }

  if (!group || !weeks)
    return null;

  return (
    <Box>
      <Box p={2}>
        {/* Group name */}
        <IconTextfield
          value={group.name}
          variant="filled"
          disabled
        />

        {/* Exercises */}
        <Box display="flex" justifyContent="center" my={5}>
          <ExerciseChips
            noSelectionLabel='None'
            selected={selected}
            setSelected={(component) => setSelected(component as Component[])}
            components={components.tree}
          />
        </Box>

        {selected.length ? <LocalizationProvider dateAdapter={AdapterDayjs as any}>
          <Box display='flex' justifyContent='center' alignItems='center' m={1}>
            {/* Start time */}
            <TimePicker
              fullWidth
              label="Start Time"
              value={training.startTime as any}
              onChange={(date) => setTraining({ ...training, startTime: date as any })}
              sx={{mr: 1}}
            />

            {/* End time */}
            <TimePicker
              fullWidth
              label="End Time"
              value={training.endTime as any}
              onChange={(date) => setTraining({ ...training, endTime: date as any })}
            />
          </Box>
        </LocalizationProvider> : null}
      </Box>

      <Box p={2} borderRadius={2} borderColor="primary.main">
        {/* Cycle name and weeks count */}
        <Stack direction="row" spacing={5}>
          <Typography variant="h6" color="primary" fontWeight="bold">
            {cycle.name}
          </Typography>

          <Typography variant="body1" fontSize={20}>
            {weeks.length} weeks
          </Typography>

          <Typography variant="body1" fontSize={16}>
            {formatDate(cycle.startDate as Dayjs)} - {formatDate(cycle.endDate as Dayjs)}
          </Typography>
        </Stack>

        {/* Training weeks */}
        <Box mt={2} display="flex" flexDirection='column'>
          {/* Vertical text for week number */}
          {weeks.map((week, i) => (
            <Box display="flex" alignItems="center" key={i} m={1}>
              <Typography
                key={i}
                variant="body1"
                mr={3}
                sx={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  textAlign: 'center',
                  lineHeight: 1.5,
                  whiteSpace: 'nowrap',
                }}
              >
                Week {i + 1}
              </Typography>

              {/* 7 days of trainings for each week */}
              <Box
                display="flex"
                justifyContent="space-between"
                width="100%"
              >
                {week.map(({ date, trainings }, j) => (
                  <Box key={j} display="flex" flexDirection="column">
                    <Stack direction='row'>
                      <Typography variant="body1" fontWeight="bold" mr={1}>
                        {formatDate(date as Dayjs)}

                        {selected.length ? <IconButton onClick={() => createTraining({ ...training, date: dayjs(date) as Dayjs })}>
                          <AddCircle />
                        </IconButton> : null}
                      </Typography>
                    </Stack>

                    <Box>
                      {trainings.map((training, key) => (
                        <Box key={key} borderRadius={2} p={1} mt={1}>
                          <TrainingBox
                            training={training}
                            selectedComponents={selected.map(c => c.id)}
                            addSetGroup={addSetGroup}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}