import { useState } from 'react';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Stack, IconButton, Box, Typography } from '@mui/material';
import { Fragment } from 'react';
import { FilteredExercises } from './type';
import { Training } from '@/controller/training/type/training.type';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { SetState } from '@/common/type/state.type';
import { MainSet } from '@/controller/component/type/main-set.type';
import SelectInput from '../select-input';
import { AfterSet } from '@/controller/component/type/after-set.type';
import { Method } from '@/controller/component/type/method.type';
import Supersets from './supersets';

interface TrainingComponentProps {
  token: string;
  training: Training;
  component: TrainingComponent;
  components: Component[];
  exercises: Exercise[];
  setSelectedTrainings: SetState<Training[]>;
  filteredExercises: FilteredExercises;
  setFilteredExercises: SetState<FilteredExercises>;
  i: number;
}

export default function TrainingComponentCard(props: TrainingComponentProps) {
  const {
    token,
    training,
    component,
    components,
    exercises,
    setSelectedTrainings,
    filteredExercises,
    setFilteredExercises,
    i,
  } = props;

  const [open, setOpen] = useState(false);
  const [selectedMainSet, setSelectedMainSet] = useState<MainSet | null>();
  const [selectedAfterSet, setSelectedAfterSet] = useState<AfterSet | null>();
  const [selectedMethod, setSelectedMethod] = useState<Method | null>();

  console.log('component', component);
  console.log('exercises', exercises);

  const mainSets = [
    {
      id: '1',
      name: 'Circuit',
    } as MainSet,
    {
      id: '2',
      name: 'Block',
    } as MainSet,
  ];

  const afterSets = [
    {
      id: '1',
      name: 'Plus Sets',
    } as AfterSet,
    {
      id: '2',
      name: 'Joker Sets',
    } as AfterSet,
    {
      id: '3',
      name: 'Back-Off Sets',
    } as AfterSet,
    {
      id: '4',
      name: 'Myo Reps',
    } as AfterSet,
    {
      id: '5',
      name: 'Dynamic Effort',
    } as AfterSet,
    {
      id: '6',
      name: 'Issometric',
    },
  ];

  const methods = [
    {
      id: '1',
      name: 'Dynamic Stretching',
    } as Method,
    {
      id: '2',
      name: 'Static Stretching',
    } as Method,
    {
      id: '3',
      name: 'Joint Circles and Mobility Drills',
    } as Method,
    {
      id: '4',
      name: 'Active Isolated Stretching',
    } as Method,
    {
      id: '5',
      name: 'Yoga',
    } as Method,
    {
      id: '6',
      name: 'PNF Stretching',
    } as Method,
    {
      id: '7',
      name: 'Foam Rolling',
    } as Method,
  ];

  return (
    <Box my={1} p={0}>
      <Fragment key={i}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            my: 0.5,
          }}
        >
          <Box
            height={40}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              mt={1}
              width="100%"
              justifyContent="space-between"
            >
              <Box display="flex" p={0} alignItems="center">
                <Typography
                  sx={{
                    color: '#1EB980',
                    px: 2,
                    mb: 0,
                    textTransform: 'uppercase',
                  }}
                >
                  {component.component?.name}
                </Typography>
              </Box>
              <Box display="flex" p={0} mr={1} alignItems="center">
                <SelectInput<MainSet>
                  label={'Main Set'}
                  value={selectedMainSet?.id || ''}
                  icon={null}
                  items={mainSets}
                  itemKey="id"
                  itemName="name"
                  setValue={(mainSetId) => {
                    const mainSet = mainSets.find((g) => g.id === mainSetId)!;
                    setSelectedMainSet(mainSet);
                  }}
                  placeholder="Main Set"
                  displayInputLabel={true}
                />

                <SelectInput<AfterSet>
                  label={'After Set'}
                  value={selectedAfterSet?.id || ''}
                  icon={null}
                  items={afterSets}
                  itemKey="id"
                  itemName="name"
                  setValue={(afterSetId) => {
                    const afterSet = afterSets.find(
                      (g) => g.id === afterSetId
                    )!;
                    setSelectedAfterSet(afterSet);
                  }}
                  placeholder="After Set"
                  displayInputLabel={true}
                />

                <SelectInput<MainSet>
                  label={'Method'}
                  value={selectedMethod?.id || ''}
                  icon={null}
                  items={methods}
                  itemKey="id"
                  itemName="name"
                  setValue={(methodId) => {
                    const method = methods.find((g) => g.id === methodId)!;
                    setSelectedMethod(method);
                  }}
                  placeholder="Method"
                  displayInputLabel={true}
                />

                <IconButton
                  onClick={() => {
                    setOpen(!open);
                  }}
                >
                  {open ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Box>
            </Stack>
          </Box>

          {open && (
            <Box bgcolor="background.paper" p={2}>
              {/* Supersets */}
              <Supersets
                supersets={component.supersets || []}
                token={token}
                training={training}
                component={component}
                components={components}
                exercises={exercises}
                setSelectedTrainings={setSelectedTrainings}
                filteredExercises={filteredExercises}
                setFilteredExercises={setFilteredExercises}
              />
            </Box>
          )}
        </Box>
      </Fragment>
    </Box>
  );
}
