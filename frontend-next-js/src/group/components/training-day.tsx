'use client';

import { SetGroup, SetSubgroup, SuperExerciseInfo, Training } from '@/training/type/training.type';
import Box from '@mui/material/Box';
import React, { Fragment, useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import { Exercise } from '@/exercise/type/exercise.type';
import { useAppContext } from '@/context/app-provider';
import ExerciseList from '@/exercise/components/exercise-list';
import MyModal from '@/common/components/modal';
import toast from 'react-hot-toast';
import { ApiUtil } from '@/common/service/util/api.util';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import TrainingExerciseCard from '@/exercise/components/training-exercise-card';
import AddIcon from '@mui/icons-material/Add';
import { AppContextType } from '@/common/type/context.type';

interface Props {
  trainings: Training[];
}

export const colors = ['#FF6859', '#FFCF44', '#B15DFF', '#72DEFF', '#1E90FF', '#FF69B4', '#32CD32', '#FFA500'];

export default function TrainingDay(props: Props) {
  // context
  const { token } = useAppContext() as AppContextType;
  const { trainings } = props;

  // add set exercise
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [addExercise, setAddExercise] = useState({
    modal: false,
    order: 0,
    setSubgroup: null as SetSubgroup | null,
  });

  // selected (expanded) entities
  const [selected, setSelected] = useState({
    loading: false,
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
      await ApiUtil.updateSetExercise(data.setExerciseId, data, token);
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
      setSelected(prev => ({ ...prev, loading: true }));

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

      const response = await ApiUtil.addSetExercises({ ...info, ...other }, token);

      // update set subgroup
      setSubgroup.setExercises = [...setSubgroup.setExercises, ...response]
        .sort((a, b) => a.order - b.order);

      // update set group
      const index = setGroup.setSubgroups!.findIndex(subgroup => subgroup.id === setSubgroup.id);
      setGroup.setSubgroups![index] = setSubgroup;

      // update training
      setSelected(prev => ({ ...prev, setGroup, loading: false }));
    } catch (e: any) {
      toast.error(e.message || 'Could not add exercises to set group');
    } finally {
      setSelected(prev => ({ ...prev, exercises: [], loading: false }));
      setAddExercise(({
        modal: false,
        order: 0,
        setSubgroup: null,
      }));
    }
  }

  /**
   * Filter exercises by selected components
   */
  useEffect(() => {
    if (!selected?.setGroup)
      return;

    const setGroup = selected.setGroup!;

    async function fetchExercises() {
      const filter = { componentIds: [setGroup.componentId] };
      const response = await ApiUtil.findAllExercises(token, filter);
      setExercises(response);
    }

    async function fetchSet() {
      const response = await ApiUtil.getSet(setGroup.trainingId, setGroup.id, token);
      setSelected(prev => ({ ...prev, setGroup: response, loading: false }));
    }

    async function fetchData() {
      setSelected(prev => ({ ...prev, loading: true }));
      await fetchExercises();
      await fetchSet();
      setSelected(prev => ({ ...prev, loading: false }));
    }

    fetchData().then();
  }, [selected.setGroup?.componentId]);

  return (<>
    <Box mt={4}>
      {trainings.map((training) =>
        <Box key={training.id}>
          {training?.setGroups?.map((setGroup) => {
            const show = selected.setGroup?.componentId === setGroup.componentId;

            return (
              <Fragment key={setGroup.id}>
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
                    onClick={() => handleSelected(setGroup)}
                  >
                    <Typography sx={{ color: '#1EB980', px: 2, mb: 0, textTransform: 'uppercase' }}>
                      {setGroup.component?.name}
                    </Typography>
                  </Box>

                  {show ?
                    selected.loading ? <Typography p={2}>Loading...</Typography> :
                      <Box bgcolor="background.paper" p={2}>
                        {/* 3 Columns For Set Groups */}
                        <Grid container spacing={2}>
                          {selected.setGroup?.setSubgroups?.map((subgroup, i) => {
                            if (!subgroup.setExercises?.length && i > 0)
                              return null;

                            return <Grid xs={4} key={subgroup.id}>
                              <BorderColor color={colors[i]} />

                              <Box>
                                {subgroup?.setExercises?.map((setExercise) => (
                                  <Box key={setExercise.id}>
                                    <TrainingExerciseCard
                                      exercise={setExercise}
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
                                <IconButton onClick={() => setAddExercise({
                                  modal: true,
                                  order: i,
                                  setSubgroup: subgroup,
                                })}>
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