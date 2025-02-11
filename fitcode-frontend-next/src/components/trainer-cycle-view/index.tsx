import React, { Fragment, useState } from 'react';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Alert } from '@mui/material';
import { CommonService } from '@/common/service/common.service';
import TrainingWeek from '@/components/training-cycle-view-week';
import { Component } from '@/controller/component/type/component.type';
import ExerciseChips from '@/components/exercise-chips';
import { ComponentService } from '@/controller/component/component.service';
import { FilterTypeViewProps } from '@/app/groups/[group_id]/type';
import {
  handleAddTrainingComponents,
  handleDeleteTraining,
  handleDeleteTrainingComponent,
  handleCreateTraining,
} from './state';

export default function TrainerCycleView(props: FilterTypeViewProps) {
  const {
    token,
    group,
    setSelectedGroup,
    users,
    groups,
    exercises,
    attributes,
    components,
    trainings,
    setSelectedTrainings,
  } = props;

  const [selectedCycle, setSelectedCycle] = useState(() => group.cycles?.[0]);

  const [selectedComponents, setSelectedComponents] = useState<Component[]>([]);
  const [createTraining, setCreateTraining] = useState({
    from: dayjs(),
    to: dayjs().add(1, 'hour'),
    date: dayjs(),
  });

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
          pb={selectedComponents.length ? 0 : 3}
          sx={{
            borderBottomRightRadius: '20px',
            borderBottomLeftRadius: '20px',
            backgroundColor: '#1A2B3C',
          }}
        >
          <ExerciseChips
            noSelectionLabel="None"
            components={ComponentService.toTree(components)}
            selected={selectedComponents}
            setSelected={(component) =>
              setSelectedComponents(component as Component[])
            }
          />

          {selectedComponents.length > 0 && (
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
                  value={createTraining.from}
                  sx={{ mr: 1 }}
                  onChange={(date) =>
                    setCreateTraining({ ...createTraining, from: date! })
                  }
                />

                {/* End time */}
                <TimePicker
                  label="End Time"
                  value={createTraining.to}
                  sx={{ mr: 1 }}
                  onChange={(date) =>
                    setCreateTraining({ ...createTraining, to: date! })
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

      {selectedCycle && (
        <Box p={2} borderRadius={2} borderColor="primary.main">
          {/* Cycle name and weeks count */}
          <Stack direction="row" spacing={5} alignItems="center">
            <Typography variant="h6" color="primary" fontWeight="bold">
              {selectedCycle.name}
            </Typography>

            <Typography variant="body1" fontSize={20}>
              {selectedCycle.weeks.length || 0} weeks
            </Typography>

            <Typography variant="body1" fontSize={16}>
              {CommonService.instance.date.format(selectedCycle.from)} -{' '}
              {CommonService.instance.date.format(selectedCycle.to)}
            </Typography>
          </Stack>

          {/* Training weeks */}
          <Stack spacing={1} mt={2}>
            {selectedCycle.weeks.map((week, i) => (
              <Fragment key={i}>
                <TrainingWeek
                  index={i}
                  week={week.map(({ date }) => dayjs(date!))}
                  trainings={trainings}
                  components={selectedComponents}
                  training={createTraining}
                  addTraining={(input) =>
                    handleCreateTraining(
                      token,
                      input,
                      group,
                      setSelectedTrainings,
                      selectedCycle,
                      selectedComponents,
                      setSelectedComponents,
                      components
                    )
                  }
                  addTrainingComponent={(trainingId, input) =>
                    handleAddTrainingComponents(
                      token,
                      trainingId,
                      input,
                      setSelectedTrainings,
                      components
                    )
                  }
                  deleteTraining={(trainingId) =>
                    handleDeleteTraining(
                      trainingId,
                      token,
                      setSelectedTrainings
                    )
                  }
                  deleteTrainingComponent={(trainingId, componentId) =>
                    handleDeleteTrainingComponent(
                      trainingId,
                      componentId,
                      token,
                      {},
                      setSelectedTrainings,
                      components
                    )
                  }
                />
              </Fragment>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
