'use client';

import withAuth from '@/hoc/with-auth';
import React, { useEffect, useState } from 'react';
import { TextField } from '@mui/material';
import type { Exercise } from '@/type/exercise.type';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/AddOutlined';
import ExerciseModal from '@/app/exercises/exercise-modal';
import Grid from '@mui/material/Unstable_Grid2';
import { ExerciseCard } from '@/app/exercises/exercise-card';
import { AppContextType, useAppContext } from '@/context/app-provider';
import { Component } from '@/type/component.type';
import toast from 'react-hot-toast';
import { UserRole } from '@/enum/user-role.enum';
import { AuthContextType, useAuth } from '@/context/auth-provider';
import IconButton from '@mui/material/IconButton';
import ExerciseChips from '@/component/exercise-chips';
import { FitcodeApi } from '@/util/api';

function Page() {
  // global context
  const { token, components, attributes } = useAppContext() as AppContextType;
  const { role } = useAuth() as AuthContextType;

  // filter exercises
  const [component, setComponent] = useState<Component>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState({ name: '' });

  // add and edit modals and exercise state
  const [modal, setModal] = useState({ add: false, edit: false });
  const [exercise, setExercise] = useState<Partial<Exercise>>({ name: '', global: false });

  /**
   * Add exercise
   */
  async function addExercise(item: Partial<Exercise>) {
    // remove empty strings
    Object.keys(item).map((key) => {
      if (!item[key]) delete item[key];
    });

    try {
      const response = await FitcodeApi.createExercise(item, token);
      toast.success('Exercise added');

      const { id, rootComponentIds } = response;
      if (!component || component && rootComponentIds.includes(component.id))
        setExercises([...exercises, { ...item, id } as Exercise]);
    } catch (e) {
      toast.error(e.message || 'An error occurred');
    }
  }

  /**
   * Update exercise
   */
  async function updateExercise(item: Partial<Exercise>) {
    // remove empty strings
    Object.keys(item).map((key) => {
      if (!item[key]) delete item[key];
    });

    try {
      const response = await FitcodeApi.updateExercise(item, token);
      toast.success('Exercise updated');

      const { rootComponentIds } = response;
      if (!rootComponentIds.includes(component.id))
        setExercises(exercises.filter((exercise) => exercise.id !== item.id));
    } catch (e) {
      toast.error(e.message || 'An error occurred');
    }
  }

  /**
   * Filter exercises by selected component
   */
  useEffect(() => {
    async function fetchExercises() {
      const filter = {
        ...(search.name && { name: search.name }),
        ...(component && { componentIds: [component?.id || ''] }),
      };

      const response = await FitcodeApi.findAllExercises(token, filter);
      setExercises(response);
    }

    fetchExercises().then();
  }, [component, search]);

  /**
   * If user is admin, he will create global exercises
   */
  useEffect(() => {
    if (role.includes(UserRole.ADMIN))
      setExercise({ ...exercise, global: true });
  }, [role]);

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <ExerciseChips
          noSelectionLabel="All"
          selected={component}
          setSelected={(component) => setComponent(component as Component)}
          components={components.tree}
        />

        <Box>
          {/* Search Input */}
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={search.name}
            onChange={(e) => setSearch({ ...search, name: e.target.value })}
          />

          {/* Add Button */}
          <IconButton onClick={() => {
            setModal({ ...modal, add: true });
            setExercise({ global: exercise.global, name: '' });
          }}>
            <AddIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={2} mb={10}>
        {exercises.map((exercise) => (
          <Grid
            key={exercise.id}
            xs={4}
            sx={{ cursor: 'pointer' }}
            onClick={() => {
              setModal({ ...modal, edit: true });
              setExercise(exercise);
            }}
          >
            <ExerciseCard exercise={exercise} />
          </Grid>
        ))}
      </Grid>

      {/* Add Exercise Modal*/}
      <ExerciseModal
        data={exercise}
        setData={setExercise}
        attributes={attributes.tree}
        components={components.leafs}
        isOpen={modal.add}
        setIsOpen={(isOpen) => setModal({ ...modal, add: isOpen })}
        title={'Add Exercise'}
        icons={<>
          <IconButton onClick={() => addExercise(exercise)}>
            <AddIcon />
          </IconButton>
        </>}
      />

      {/* Edit Exercise Modal */}
      <ExerciseModal
        data={exercise}
        setData={setExercise}
        attributes={attributes.tree}
        components={components.leafs}
        isOpen={modal.edit}
        setIsOpen={(isOpen) => setModal({ ...modal, edit: isOpen })}
        title={'Update Exercise'}
        icons={<>
          <IconButton onClick={() => updateExercise(exercise)}>
            <AddIcon />
          </IconButton>
        </>}
      />
    </>
  );
}

export default withAuth(Page);