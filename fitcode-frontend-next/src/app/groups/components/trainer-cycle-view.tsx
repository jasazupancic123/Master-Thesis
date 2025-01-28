import { useAppContext } from '@/context/app-provider';
import React, { Fragment, useEffect, useState } from 'react';
import { Component } from '@/component/entity/component.entity';
import { CreateTraining } from '@/training/type/training.type';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';
import Box from '@mui/material/Box';
import ExerciseChips from '@/exercise/components/exercise-chips';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Alert } from '@mui/material';
import { AppContextType } from '@/common/type/context.type';
import { GroupPageProps } from '@/group/type/props.type';
import { CreateTrainingComponent } from '@/training/type/training-component.type';
import { CommonService } from '@/common/service/common.service';
import TrainingWeek from '@/app/groups/components/training-cycle-view-week';
import { TrainingController } from '@/training/training.controller';
import Warning from '@/common/components/warning';

export default function TrainerCycleView(props: GroupPageProps) {
  // context
  const { token, components } = useAppContext() as AppContextType;
  const [global, setGlobal] = useState(true);
  const [selected, setSelected] = useState<Component[]>([]);
  const [create, setCreate] = useState({
    training: {
      from: dayjs(),
      to: dayjs().add(2, 'hour'),
      date: dayjs(),
    },
  });

  /**
   * Set date to cycle start and end when opening the page
   */
  useEffect(() => {
    if (!props.selected.cycle) return;
    props.setDate({
      start: dayjs(props.selected.cycle.from).startOf('week'),
      end: dayjs(props.selected.cycle.to).endOf('week'),
      custom: false,
    });
  }, [props.selected.cycle?.id]);

  async function createTraining(
    data: Pick<CreateTraining, 'from' | 'to'> & { date: Dayjs }
  ) {
    if (!props.selected.cycle || !props.selected.group) {
      toast.error('Please select a group and cycle');
      return;
    }

    if (!selected.length) {
      toast.error('Select at least one component');
      return;
    }

    // set start time and end time to date
    const from = data.date
      .set('year', data.date.year())
      .set('month', data.date.month())
      .set('date', data.date.date())
      .set('hour', data.from.hour())
      .set('minute', data.from.minute())
      .set('second', data.from.second());

    const to = data.date
      .set('year', data.date.year())
      .set('month', data.date.month())
      .set('date', data.date.date())
      .set('hour', data.to.hour())
      .set('minute', data.to.minute())
      .set('second', data.to.second());

    try {
      const response = await TrainingController.addTraining(token, {
        groupId: props.selected.group!.id,
        cycleId: props.selected.cycle!.id,
        subgroupId: props.selected.subgroup?.id || null,
        componentIds: selected.map((c) => c.id),
        from,
        to,
      });

      if (!response) {
        toast.error('Failed to create training');
        return;
      }

      // update selected trainings
      props.setSelected((prev) => ({
        ...prev,
        cycle: {
          ...prev.cycle!,
          trainings: [...(prev.cycle?.trainings || []), response],
        },
      }));

      setSelected([]);
    } catch (e: any) {
      toast.error(e.message || 'Failed to create training');
    }
  }

  async function addTrainingComponents(
    trainingId: string,
    data: CreateTrainingComponent[]
  ) {
    if (!props.selected.cycle || !props.selected.group) {
      toast.error('Please select a group and cycle');
      return;
    }

    try {
      const response = await TrainingController.addTrainingComponents(
        token,
        trainingId,
        data
      );

      // update training
      props.setSelected((prev) => ({
        ...prev,
        cycle: {
          ...props.selected.cycle!,
          trainings: props.selected.cycle!.trainings.map((training) => {
            if (training.id === trainingId)
              return {
                ...training,
                components: [...(training.components || []), ...response],
              };

            return training;
          }),
        },
      }));
    } catch (e: any) {
      toast.error(e.message || 'Failed to add set group');
    }
  }

  async function deleteTraining(trainingId: string) {
    try {
      await TrainingController.deleteTraining(token, trainingId);

      // update selected trainings
      props.setSelected((prev) => ({
        ...prev,
        cycle: {
          ...prev.cycle!,
          trainings:
            prev.cycle?.trainings?.filter((t) => t.id !== trainingId) || [],
        },
      }));
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete training');
    }
  }

  if (!props.selected.group || !props.selected.cycle)
    return <Warning title="Select cycle" topBorder />;

  return (
    <Box pb={10}>
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

          {selected.length > 0 && (
            <LocalizationProvider dateAdapter={AdapterDayjs as any}>
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                mt={5}
              >
                {/* Start time */}
                <TimePicker
                  label="Start Time"
                  value={create.training.from}
                  onChange={(date) =>
                    setCreate({
                      ...create,
                      training: { ...create.training, from: date! },
                    })
                  }
                  sx={{ mr: 1 }}
                />

                {/* End time */}
                <TimePicker
                  label="End Time"
                  value={create.training.to}
                  onChange={(date) =>
                    setCreate({
                      ...create,
                      training: { ...create.training, to: date! },
                    })
                  }
                />
              </Box>

              <Alert severity="info" sx={{ mt: 2, alignSelf: 'flex-end' }}>
                Select time and click on a day below to create a training
              </Alert>
            </LocalizationProvider>
          )}
        </Box>
      </Box>

      <Box p={2} borderRadius={2} borderColor="primary.main">
        {/* Cycle name and weeks count */}
        <Stack direction="row" spacing={5} alignItems="center">
          <Typography variant="h6" color="primary" fontWeight="bold">
            {props.selected.cycle!.name}
          </Typography>

          <Typography variant="body1" fontSize={20}>
            {props.selected.cycle!.weeks?.length || 0} weeks
          </Typography>

          <Typography variant="body1" fontSize={16}>
            {CommonService.instance.date.format(props.selected.cycle!.from)} -{' '}
            {CommonService.instance.date.format(props.selected.cycle!.to)}
          </Typography>
        </Stack>

        {/* Training weeks */}
        {props.loading ? (
          <Typography>Loading ...</Typography>
        ) : (
          <Stack spacing={1} mt={2}>
            {props.selected.cycle!.weeks.map((week, i) => (
              <Fragment key={i}>
                <TrainingWeek
                  index={i}
                  week={week.map(({ date }) => dayjs(date!))}
                  trainings={props.selected.cycle!.trainings || []}
                  components={selected}
                  training={create.training}
                  addTraining={createTraining}
                  addTrainingComponent={addTrainingComponents}
                  deleteTraining={deleteTraining}
                />
              </Fragment>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
