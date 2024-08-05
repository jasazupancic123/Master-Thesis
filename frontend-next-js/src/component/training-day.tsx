'use client';

import { SetExercise, SetGroup, SetSubgroup, Training } from '@/type/training.type';
import Box from '@mui/material/Box';
import React, { Fragment, useEffect, useState } from 'react';
import { Badge, Collapse, Divider } from '@mui/material';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { AddCircle } from '@mui/icons-material';
import { Exercise } from '@/type/exercise.type';
import Stack from '@mui/material/Stack';
import { fetcher } from '@/util/fetcher';
import { AppContextType, useAppContext } from '@/context/app-provider';
import qs from 'qs';
import ExerciseList from '@/component/exercise-list';
import MyModal from '@/component/modal';
import toast from 'react-hot-toast';
import SetExerciseCard from '@/component/set-exercise-card';
import Grid from '@mui/material/Unstable_Grid2';

interface Props {
  trainings: Training[];
  setTrainings: (trainings: Training[]) => void;
}

const colors = ['#FF6859', '#FFCF44', '#B15DFF', '#72DEFF', '#1E90FF', '#FF69B4', '#32CD32', '#FFA500'];

export default function TrainingDay(props: Props) {
  // context
  const { token } = useAppContext() as AppContextType;
  const { trainings, setTrainings } = props;

  // add set exercise
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState({ name: '' });
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
   * Filter exercises by selected component
   */
  useEffect(() => {
    async function fetchExercises() {
      const filter = {
        ...(search.name && { name: search.name }),
        ...(selected.setGroup && { componentIds: [selected.setGroup.componentId].join(',') }),
      };

      const query = qs.stringify(filter);
      const url = query ? `/exercise?${query}` : '/exercise';

      const response = await fetcher<Exercise[]>(url, { token });
      setExercises(response);
    }

    fetchExercises().then();
  }, [selected, search]);

  async function addExercisesToSetSubgroup(setSubgroup: SetSubgroup, setGroup: SetGroup, exercises: Exercise[]) {
    if (!exercises.length) {
      toast.error('Please select exercises');
      return;
    }

    try {
      const ordered = (setSubgroup.setExercises || []).sort((a, b) => a.order - b.order);
      const order = ordered.length ? ordered[ordered.length - 1].order + 1 : 0;

      const response = await fetcher<SetExercise[]>(`/training/set-subgroup/${setSubgroup.id}`, {
        method: 'POST',
        token,
        body: {
          exerciseIds: exercises.map(exercise => exercise.id),
          sets: 3,
          setType: 'reps',
          setTypeValue: 12,
          workloadType: 'kg',
          workloadValue: 20,
          tempo: undefined,
          effort: undefined,
          rec: 60,
          order,
        },
      });

      // update set subgroup
      setSubgroup.setExercises = [...setSubgroup.setExercises, ...response]
        .sort((a, b) => a.order - b.order);

      // update set group
      const index = setGroup.setSubgroups!.findIndex(subgroup => subgroup.id === setSubgroup.id);
      setGroup.setSubgroups![index] = setSubgroup;

      // update training
      const trainingIndex = trainings.findIndex(training => training.id === setGroup.trainingId);
      if (trainingIndex !== -1) {
        const training = trainings[trainingIndex];
        const setGroupIndex = training.setGroups!.findIndex(group => group.id === setGroup.id);

        if (setGroupIndex !== -1) {
          training.setGroups![setGroupIndex] = setGroup;
          trainings[trainingIndex] = training;
          setTrainings([...trainings]);
        }
      }
    } catch (e) {
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

  return (<>
    <Box>
      {trainings.map((training, j) =>
        <Box key={training.id}>
          {training?.setGroups?.map((setGroup) => {
            return (
              <Fragment key={setGroup.id}>
                <Badge
                  badgeContent={j + 1}
                  color="secondary"
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                />

                <Box
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
                      {setGroup.component!.name}
                    </Typography>
                  </Box>

                  <Collapse in={selected.setGroup?.component === setGroup.component} sx={{ p: 1 }}>
                    <Box sx={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                      {/* 3 Columns For Set Groups*/}
                      <Grid container spacing={2}>
                        {setGroup.setSubgroups?.map((subgroup, i) => {
                          return <Grid xs={4} key={subgroup.id}>
                            {/* Set Group Exercises */}
                            <BorderColor color={colors[i]} />

                            <Box>
                              {subgroup?.setExercises?.map((setExercise) => (
                                <Box key={setExercise.id}>
                                  <SetExerciseCard
                                    setExercise={setExercise}
                                    setSetExercise={(setExercise) => {
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
                    </Box>
                  </Collapse>
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
          await addExercisesToSetSubgroup(addExercise.setSubgroup, selected.setGroup, selected.exercises);
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