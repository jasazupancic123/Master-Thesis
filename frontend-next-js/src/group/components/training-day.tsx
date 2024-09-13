'use client';

import { Training } from '@/training/entity/training.entity';
import Box from '@mui/material/Box';
import React, { Fragment, useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import { Exercise } from '@/exercise/entity/exercise.entity';
import { useAppContext } from '@/context/app-provider';
import ExerciseList from '@/exercise/components/exercise-list';
import MyModal from '@/common/components/modal';
import toast from 'react-hot-toast';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import TrainingExerciseCard from '@/exercise/components/training-exercise-card';
import AddIcon from '@mui/icons-material/Add';
import { AppContextType } from '@/common/type/context.type';
import { TrainingExercise } from '@/training/entity/training-exercise.entity';
import { GroupController } from '@/group/group.controller';
import { Group } from '@/group/entity/group.entity';
import { Cycle } from '@/group/entity/cycle.entity';
import { TrainingExerciseMeta } from '@/training/entity/training-exercise-meta.entity';
import { SetType } from '@/training/enum/set-type.enum';
import { WorkloadType } from '@/training/enum/workload-type.enum';
import { Effort } from '@/training/enum/effort.enum';
import { ExerciseController } from '@/exercise/exercise.controller';
import { TrainingComponent } from '@/training/entity/training-component.entity';
import { TrainingSuperset } from '@/training/entity/training-superset.entity';

interface Props {
  group: Group;
  cycle: Cycle;
  trainings: Training[];
}

export const colors = ['#FF6859', '#FFCF44', '#B15DFF', '#72DEFF', '#1E90FF', '#FF69B4', '#32CD32', '#FFA500'];

export default function TrainingDay(props: Props) {
  // context
  const { token, components } = useAppContext() as AppContextType;
  const { group, cycle, trainings } = props;

  // add set exercise
  const [global, setGlobal] = useState(true); // exercise filter
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ exercise: false });

  // selected (expanded) entities
  const [selected, setSelected] = useState<{
    component: TrainingComponent | null,
    exercises: Exercise[], // selected exercises to create
    superset: TrainingSuperset | null, // needed for modal when adding exercises
  }>({
    component: null,
    exercises: [],
    superset: null,
  });

  function handleSelected(component: TrainingComponent) {
    if (selected.component?.componentId === component?.componentId) {
      // same training component selected, collapse
      setSelected(prev => ({ ...prev, component: null }));
    } else {
      // new training component selected, expand
      setSelected(prev => ({ ...prev, component }));
    }

    setModal({ exercise: false });
  }

  async function addSuperset(trainingId: string) {
    const component = selected.component;
    if (!component) return;

    try {
      const superset = await GroupController.addSuperset(token, group.id, cycle.id, trainingId, component.componentId, {});

      // update selected component with new superset
      setSelected(prev => ({
        ...prev,
        component: {
          ...prev.component!,
          supersets: [
            ...prev.component!.supersets,
            superset,
          ].sort((a, b) => a.order - b.order),
        },
      }));
    } catch (e: any) {
      toast.error(e.message || 'Failed to add superset');
    }
  }

  async function updateTrainingExercise(trainingId: string, supersetId: string, exerciseId: string, data: Partial<TrainingExercise>) {
    const component = selected.component;
    if (!component) return;

    try {
      await GroupController.updateExercise(token, group.id, cycle.id, trainingId, component.componentId, supersetId, exerciseId, data);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update set exercise');
    }
  }

  async function addTrainingExercise(trainingId: string, supersetId: string, exercises: Exercise[]) {
    const component = selected.component;
    if (!component) return;

    const superset = component.supersets.find(s => s.id === supersetId);
    if (!superset) {
      toast.error('Wrong superset');
      return;
    }

    if (!exercises.length) {
      toast.error('Please select exercises');
      return;
    }

    try {
      setLoading(true);

      const meta: TrainingExerciseMeta = {
        sets: 3,
        setType: SetType.REPS,
        setTypeValue: 10,
        workloadType: WorkloadType.KG,
        workloadValue: 20,
        rec: 60,
        tempo: '0:0:0',
        effort: Effort.MODERATE,
      };

      const responses = await Promise.all(exercises.map(exercise => GroupController.addTrainingExercise(token, group.id, cycle.id, trainingId, component.componentId, supersetId, {
        exerciseId: exercise.id,
        meta,
      })));

      // update selected superset with new set exercises
      setSelected(prev => ({
        ...prev,
        component: {
          ...prev.component!,
          supersets: [
            ...prev.component!.supersets.filter(s => s.id !== supersetId),
            {
              ...superset,
              exercises: [
                ...superset.exercises,
                ...responses,
              ].sort((a, b) => a.order - b.order),
            },
          ].sort((a, b) => a.order - b.order),
        },
      }));
    } catch (e: any) {
      toast.error(e.message || 'Could not add exercises to training');
    } finally {
      setModal({ exercise: false });
      setLoading(false);
    }
  }

  /**
   * Filter exercises by selected components
   */
  useEffect(() => {
    async function fetchExercises() {
      const component = selected.component;
      if (!component) return;

      try {
        setLoading(true);

        const filter = {
          global,
          componentsIds: [component.componentId],
        };

        const response = await ExerciseController.findExercises(token, filter);
        setExercises(response.data);
      } catch (e: any) {
        toast.error(e.message || 'Failed to fetch exercises');
      } finally {
        setLoading(false);
      }
    }

    fetchExercises().then();
  }, [selected.component?.componentId]);

  return (<>
    <Box mt={4}>
      {trainings.map((training) =>
        <Box key={training.id}>
          {training?.components?.map((component) => {
            const show = selected.component?.componentId === component.componentId;

            return (
              <Fragment key={component.componentId}>
                <Box sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  my: 2,
                }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: '40px',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSelected(component)}
                  >
                    <Typography sx={{ color: '#1EB980', px: 2, mb: 0, textTransform: 'uppercase' }}>
                      {components.flat.find(({ id }) => id === component.componentId)?.name}
                    </Typography>
                  </Box>

                  {show ?
                    loading ? <Typography p={2}>Loading...</Typography> :
                      <Box bgcolor="background.paper" p={2}>
                        {/* Add superset */}
                        <IconButton onClick={async () => await addSuperset(training.id)}>
                          <AddIcon />
                        </IconButton>

                        {/* Supersets */}
                        <Grid container spacing={2} wrap="wrap">
                          {selected.component?.supersets
                            ?.sort((a, b) => a.order - b.order)
                            ?.map((superset, i) => {
                              return <Grid xs={4} key={superset.id}>
                                <BorderColor color={colors[i]} />

                                <Box>
                                  {superset.exercises.map((exercise) => (
                                    <Box key={exercise.exerciseId}>
                                      <TrainingExerciseCard
                                        exercise={exercise}
                                        onChange={async (meta) => {
                                          await updateTrainingExercise(
                                            training.id,
                                            superset.id,
                                            exercise.exerciseId,
                                            { meta } as Partial<TrainingExercise>);
                                        }}
                                      />
                                    </Box>
                                  ))}
                                </Box>

                                <BorderColor color={colors[i]} lower />

                                {/* Add exercises to superset */}
                                <Stack
                                  direction="row"
                                  justifyContent="center"
                                  mt={2}
                                  spacing={1}
                                  sx={{
                                    border: '1px dashed #B2B3B7',
                                    borderRadius: 2,
                                  }}
                                >
                                  <IconButton onClick={() => {
                                    setSelected(prev => ({ ...prev, superset }));
                                    setModal({ exercise: true });
                                  }}>
                                    <AddIcon />
                                  </IconButton>
                                </Stack>
                              </Grid>;
                            })}
                        </Grid>
                      </Box> : null}
                </Box>

              </Fragment>
            );
          })}
        </Box>,
      )}
    </Box>

    <MyModal
      isOpen={modal.exercise}
      setIsOpen={(modal) => setModal({ exercise: modal })}
      title="Choose exercises"
      onCancel={() => setSelected(prev => ({ ...prev, exercises: [] }))}
      onConfirm={async () => {
        const { component, superset, exercises } = selected;
        if (!component || !superset || !exercises?.length)
          return;

        // find training based on superset
        const training = trainings.find(({ components }) => components.find(({ supersets }) => supersets.find(({ id }) => id === superset.id)));
        if (!training)
          return;

        await addTrainingExercise(training.id, superset.id, exercises);
      }}
    >
      <ExerciseList
        global={global}
        setGlobal={setGlobal}
        exercises={exercises}
        selectedExercises={selected.exercises}
        setSelectedExercises={(exercises) => setSelected(prev => ({ ...prev, exercises }))}
      />
    </MyModal>
  </>);
}

function BorderColor(props: { color: string, lower?: boolean }) {
  if (props.lower)
    return <Box
      sx={{
        height: '6px',
        borderBottomRightRadius: '25px',
        borderBottomLeftRadius: '25px',
        backgroundColor: props.color,
        width: '100%',
      }}
    />;

  return <Box
    sx={{
      height: '6px',
      borderTopRightRadius: '25px',
      marginBottom: '5px',
      borderTopLeftRadius: '25px',
      backgroundColor: props.color,
      width: '100%',
    }}
  />;
}