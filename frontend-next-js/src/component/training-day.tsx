'use client';

import { SetGroup, SetSubgroup, SuperExerciseInfo, Training } from '@/type/training.type';
import Box from '@mui/material/Box';
import React, { Fragment, useEffect, useState } from 'react';
import { Divider } from '@mui/material';
import Typography from '@mui/material/Typography';
import { Exercise } from '@/type/exercise.type';
import { AppContextType, useAppContext } from '@/context/app-provider';
import ExerciseList from '@/component/exercise-list';
import MyModal from '@/component/modal';
import toast from 'react-hot-toast';
import { FitcodeApi } from '@/util/api';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import SetExerciseCard from '@/component/set-exercise-card';
import { AddCircle } from '@mui/icons-material';

interface Props {
  trainings: Training[];
  setTrainings: (trainings: Training[]) => void;
  loading?: boolean;
}

export const colors = ['#FF6859', '#FFCF44', '#B15DFF', '#72DEFF', '#1E90FF', '#FF69B4', '#32CD32', '#FFA500'];

export default function TrainingDay(props: Props) {
  // context
  const { token, components } = useAppContext() as AppContextType;
  const { trainings, setTrainings, loading } = props;

  // populate set groups with components
  for (const training of trainings)
    for (const setGroup of training.setGroups || [])
      setGroup.component = components.flat.find(component => component.id === setGroup.componentId)!;

  // add set exercise
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [addExercise, setAddExercise] = useState({
    modal: false,
    order: 0,
    setSubgroup: null as SetSubgroup | null,
  });

  // selected (expanded) entities
  const [selected, setSelected] = useState({
    setGroup: null as SetGroup | null,
    exercises: [] as Exercise[],
  });

  function handleSelected(setGroup: SetGroup) {
    if (selected.setGroup === setGroup) {
      // same set group selected, collapse
      setSelected(prev => ({ ...prev, setGroup: null }));
    } else {
      // new set group selected, expand
      setSelected(prev => ({ ...prev, setGroup }));
    }

    setAddExercise(({
      modal: false,
      order: 0,
      setSubgroup: null,
    }));
  }

  /**
   * Update set exercise
   */
  async function updateSetExercise(data: Partial<SuperExerciseInfo> & { order: number }) {
    if (!selected.setGroup || !data.setExerciseId)
      return;

    try {
      await FitcodeApi.updateSetExercise(data.setExerciseId, data, token);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update set exercise');
    }
  }

  /**
   * Add set exercises
   */
  async function addSetExercises(setSubgroup: SetSubgroup, setGroup: SetGroup, exercises: Exercise[]) {
    if (!exercises.length) {
      toast.error('Please select exercises');
      return;
    }

    try {
      const info = {
        sets: 3,
        setType: 'reps',
        setTypeValue: 10,
        workloadType: 'kg',
        workloadValue: 20,
        rec: 60,
        tempo: '0:0:0',
        effort: 'moderate',
      } as SuperExerciseInfo;

      const other = {
        setSubgroupId: setSubgroup.id,
        exerciseIds: exercises.map(exercise => exercise.id),
      };

      const response = await FitcodeApi.addSetExercises({ ...info, ...other }, token);

      // update set subgroup
      setSubgroup.setExercises = [...setSubgroup.setExercises, ...response]
        .sort((a, b) => a.order - b.order);

      // update set group
      const index = setGroup.setSubgroups!.findIndex(subgroup => subgroup.id === setSubgroup.id);
      setGroup.setSubgroups![index] = setSubgroup;

      // update training
      setSelected(prev => ({ ...prev, setGroup }));
    } catch (e: any) {
      toast.error(e.message || 'Could not add exercises to set group');
    } finally {
      setSelected(prev => ({ ...prev, exercises: [] }));
      setAddExercise(({
        modal: false,
        order: 0,
        setSubgroup: null,
      }));
    }
  }

  /**
   * Filter exercises by selected component
   */
  useEffect(() => {
    if (!selected?.setGroup)
      return;

    const setGroup = selected.setGroup!;

    async function fetchExercises() {
      const filter = {
        componentIds: [setGroup.componentId],
      };

      const response = await FitcodeApi.findAllExercises(token, filter);
      setExercises(response);
    }

    async function fetchSet() {
      const response = await FitcodeApi.getSet(setGroup.trainingId, setGroup.id, token);
      setSelected(prev => ({ ...prev, setGroup: response }));
    }

    fetchSet().then();
    fetchExercises().then();
  }, [selected.setGroup?.componentId]);

  return (<>
    <Box mt={4}>
      {trainings.map((training, j) =>
        <Box key={training.id}>
          {training?.setGroups?.map((setGroup, i) => {
            const show = selected.setGroup?.componentId === setGroup.componentId;

            return (
              <Fragment key={setGroup.id}>
                <Box
                  my={1}
                  sx={{
                    backgroundColor: '#1A2B3C',
                    borderRadius: '4px',
                    width: '100%',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      height: '40px',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSelected(setGroup)}
                  >
                    <Typography sx={{ color: '#1EB980', px: 2, mb: 0, textTransform: 'uppercase' }}>
                      {setGroup.component?.name}
                    </Typography>
                  </Box>

                  {show ? <Box sx={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    {/* 3 Columns For Set Groups */}
                    <Grid container spacing={2}>
                      {selected.setGroup?.setSubgroups?.map((subgroup, i) => {
                        return <Grid xs={4} key={subgroup.id}>
                          <BorderColor color={colors[i]} />

                          <Box>
                            {subgroup?.setExercises?.map((setExercise) => (
                              <Box key={setExercise.id}>
                                <SetExerciseCard
                                  setExercise={setExercise}
                                  onChange={async (data) => {
                                    await updateSetExercise({
                                      setExerciseId: setExercise.id,
                                      ...data,
                                    });
                                  }}
                                />
                              </Box>
                            ))}
                          </Box>

                          <BorderColor color={colors[i]} lower />

                          <Stack direction="row" justifyContent="center" mt={2} spacing={1}>
                            <IconButton onClick={() => setAddExercise({
                              modal: true,
                              order: i,
                              setSubgroup: subgroup,
                            })}>
                              <AddCircle />
                            </IconButton>
                          </Stack>
                        </Grid>;
                      })}
                    </Grid>
                  </Box> : null}
                </Box>

                <Divider sx={{ backgroundColor: '#303E4A', height: '4px' }} />
              </Fragment>
            );
          })}
        </Box>,
      )}
    </Box>

    <MyModal
      isOpen={addExercise.modal}
      setIsOpen={(modal) => setAddExercise(prev => ({ ...prev, modal }))}
      title="Choose exercises"
      onCancel={() => setSelected(prev => ({ ...prev, exercises: [] }))}
      onConfirm={async () => {
        if (addExercise.setSubgroup && selected.setGroup)
          await addSetExercises(addExercise.setSubgroup, selected.setGroup, selected.exercises);
      }}
    >
      <ExerciseList
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