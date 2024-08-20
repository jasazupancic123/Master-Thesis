import { GroupPageProps } from '@/app/groups/props';
import { AppContextType, useAppContext } from '@/context/app-provider';
import React, { Fragment, useEffect, useState } from 'react';
import { Component } from '@/type/component.type';
import { AddSetGroup, CreateTraining, Training } from '@/type/training.type';
import dayjs, { Dayjs } from 'dayjs';
import { formatDate, isDateBetween } from '@/util/date';
import toast from 'react-hot-toast';
import { FitcodeApi } from '@/util/api';
import Box from '@mui/material/Box';
import ExerciseChips from '@/component/exercise-chips';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Firestore } from '@/util/firebase';
import IconButton from '@mui/material/IconButton';
import { AddCircle } from '@mui/icons-material';
import { Alert, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function TrainerCycleView(props: GroupPageProps) {
  // context
  const { token, components } = useAppContext() as AppContextType;
  const cycle = props.selected.cycle!;

  // filter exercise component
  const [selected, setSelected] = useState<Component[]>([]);

  // create training
  const [create, setCreate] = useState<{ training: CreateTraining }>({
    training: {
      startTime: dayjs(),
      endTime: dayjs().add(2, 'hour'),
      date: dayjs(),
    },
  });

  /**
   * Create training
   */
  async function createTraining(data: CreateTraining) {
    if (!selected.length) {
      toast.error('Select atleast one component');
      return;
    }

    // set start time and end time to date
    const startTime = data.date
      .set('year', data.date.year())
      .set('month', data.date.month())
      .set('date', data.date.date())
      .set('hour', data.startTime.hour())
      .set('minute', data.startTime.minute())
      .set('second', data.startTime.second());

    const endTime = data.date
      .set('year', data.date.year())
      .set('month', data.date.month())
      .set('date', data.date.date())
      .set('hour', data.endTime.hour())
      .set('minute', data.endTime.minute())
      .set('second', data.endTime.second());

    try {
      const body = {
        cycleId: cycle.id,
        subgroupId: props.selected.subgroup?.id,
        componentIds: selected.map(c => c.id),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };

      const response = await FitcodeApi.createTraining(body, token);
      props.setSelected(prev => ({ ...prev, trainings: [...prev.trainings, response] }));

      toast.success('Training created');
    } catch (e) {
      toast.error(e.message || 'Failed to create training');
    }
  }

  /**
   * Add set group (training component) to training
   */
  async function addSet(data: AddSetGroup) {
    try {
      for (const componentId of data.componentIds) {
        const body = {
          trainingId: data.trainingId,
          componentId,
          order: 0,
          color: 'red',
        };

        const response = await FitcodeApi.addSet(body, token);
        props.setSelected(prev => ({
          ...prev,
          trainings: prev.trainings.map(training => {
            if (training.id === data.trainingId)
              return {
                ...training,
                setGroups: [...(training.setGroups || []), response],
              };

            return training;
          }),
        }));
      }
    } catch (e) {
      toast.error(e.message || 'Failed to add set group');
    }
  }

  /**
   * Delete training and all corresponding set data
   */
  async function deleteTraining(training: Training) {
    try {
      await FitcodeApi.removeTraining(training.id, token);
      props.setSelected(prev => ({ ...prev, trainings: prev.trainings.filter(t => t.id !== training.id) }));

      toast.success('Training removed');
    } catch (e) {
      toast.error(e.message || 'Failed to remove training');
    }
  }

  /**
   * Set date to cycle start and end when opening the page
   */
  useEffect(() => {
    if (!cycle)
      return;

    props.setDate({
      start: dayjs(cycle.startDate).startOf('day'),
      end: dayjs(cycle.endDate).endOf('day'),
      custom: false,
    });
  }, []);

  if (!cycle)
    return null;

  return (
    <Box>
      <Box>
        {/* Exercises */}
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          pt={3}
          pb={selected.length ? 0 : 3}
          sx={{
            borderBottomRightRadius: '20px',
            borderBottomLeftRadius: '20px',
            backgroundColor: '#1A2B3C',
          }}
        >
          <ExerciseChips
            noSelectionLabel="None"
            selected={selected}
            setSelected={(component) => setSelected(component as Component[])}
            components={components.tree}
          />

          {selected.length > 0 && <LocalizationProvider dateAdapter={AdapterDayjs as any}>
            <Box display="flex" justifyContent="center" alignItems="center" mt={5}>
              {/* Start time */}
              <TimePicker
                fullWidth
                label="Start Time"
                value={create.training.startTime as any}
                onChange={(date) => setCreate({
                  ...create,
                  training: { ...create.training, startTime: date as any },
                })}
                sx={{ mr: 1 }}
              />

              {/* End time */}
              <TimePicker
                fullWidth
                label="End Time"
                value={create.training.endTime as any}
                onChange={(date) => setCreate({
                  ...create,
                  training: { ...create.training, endTime: date as any },
                })}
              />
            </Box>

            <Alert severity="info" sx={{ mt: 2, alignSelf: 'flex-end' }}>
              Select time and click on a day below to create a training
            </Alert>
          </LocalizationProvider>}
        </Box>
      </Box>

      <Box p={2} borderRadius={2} borderColor="primary.main">
        {/* Cycle name and weeks count */}
        <Stack direction="row" spacing={5} alignItems="center">
          <Typography variant="h6" color="primary" fontWeight="bold">
            {cycle.name}
          </Typography>

          <Typography variant="body1" fontSize={20}>
            {cycle.weeks?.length || 0} weeks
          </Typography>

          <Typography variant="body1" fontSize={16}>
            {formatDate(cycle.startDate as Dayjs)} - {formatDate(cycle.endDate as Dayjs)}
          </Typography>
        </Stack>

        {/* Training weeks */}
        <Stack spacing={1} mt={2}>
          {cycle.weeks?.map((week, i) => (
            <Fragment key={i}>
              <TrainingWeek
                index={i}
                week={week.map(({ date }) => date!)}
                trainings={props.selected.trainings}
                components={selected}
                training={create.training}
                createTraining={createTraining}
                addSetGroup={addSet}
                deleteTraining={deleteTraining}
              />
            </Fragment>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

function TrainingWeek(props: {
  index: number,
  week: Dayjs[],
  trainings: Training[],
  training: CreateTraining,
  components: Component[],
  createTraining: (data: CreateTraining) => void,
  addSetGroup: (data: AddSetGroup) => void,
  deleteTraining: (training: Training) => Promise<void>,
}) {
  function getFilteredTrainings(date: Dayjs) {
    date = dayjs(date);

    return props.trainings.map(training => {
      const start = dayjs(training.startTime).startOf('day');
      const end = dayjs(training.endTime).endOf('day');

      if (isDateBetween(date, start, end))
        return training;

      return null;
    });
  }

  return <Box>
    <Box direction="column">
      {/* Render days of the week */}
      <Stack
        direction="row"
        p={2}
        sx={{
          padding: '0px',
          textAlign: 'center',
          border: '1px solid',
          borderColor: '#303E4A',
          backgroundColor: '#1A2B3C',
          height: '100%',
          cursor: props.components.length ? 'pointer' : 'default',
          borderTopLeftRadius: 8,
          borderBottomLeftRadius: 8,
        }}>
        {/* Extra column to display the week number */}
        <Typography
          color="#1A2B3C"
          bgcolor="#1EB980"
          p={2}
          sx={{
            backgroundColor: '#1EB980',
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            borderBottomRightRadius: 8,
            borderTopRightRadius: 8,
          }}
        >
          Week {props.index + 1}
        </Typography>

        {props.week.map((date, j) => (
          <Box
            key={j}
            width="calc(100% / 7)"
            sx={{
              border: '1px solid',
              borderColor: '#303E4A',
              backgroundColor: '#1A2B3C',
              cursor: props.components.length ? 'pointer' : 'default',
            }}
            onClick={async () => {
              if (props.components.length)
                await props.createTraining({ ...props.training, date: dayjs(date) as Dayjs });
            }}
          >
            <Typography sx={{ color: '#fff', fontSize: '0.7rem', opacity: 0.7 }}>
              {formatDate(date)}
            </Typography>

            {/* Full-width divider */}
            <Divider />

            <Box>
              {getFilteredTrainings(date).map((training, key) => (
                !training ? null :
                  <Box key={key} borderRadius={2} p={1}>
                    <TrainingGridItem
                      order={key + 1}
                      training={training}
                      components={props.components}
                      addSetGroup={props.addSetGroup}
                      deleteTraining={props.deleteTraining}
                    />
                  </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  </Box>;
}

function TrainingGridItem(props: {
  training: Training;
  order: number;
  components: Component[];
  addSetGroup: (data: AddSetGroup) => void;
  deleteTraining: (training: Training) => Promise<void>;
}) {
  const { training, deleteTraining } = props;
  const { components } = useAppContext() as AppContextType;

  // populate training with components
  const populated = Firestore.populateTraining(training, components.flat);
  const setGroups = populated.setGroups || [];

  return <Box px={1}>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Box sx={{ flex: 1 }}>
        <Divider />

        <Typography variant="caption" color="primary" fontSize={12}>
          Training #{props.order}
        </Typography>
      </Box>

      <IconButton size="small" onClick={async (e) => {
        e.stopPropagation();
        await deleteTraining(training);
      }}>
        <DeleteIcon />
      </IconButton>
    </Box>


    <ExerciseChips
      components={setGroups.map(({ component }) => component)}
      itemSx={{ fontSize: 10, cursor: 'default' }}
      direction="column"
      small
    />

    {/* Add set group icon */}
    {props.components.length > 0 && <>
      <IconButton size="small" onClick={() => props.addSetGroup({
        trainingId: training.id,
        componentIds: props.components.map(c => c.id),
      })}>
        <AddCircle />
      </IconButton>
    </>}
  </Box>;
}