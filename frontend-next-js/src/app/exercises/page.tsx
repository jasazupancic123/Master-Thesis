'use client';

import withAuth from '@/hoc/with-auth';
import React, { useEffect, useState } from 'react';
import { Pagination, TextField } from '@mui/material';
import type { Exercise } from '@/type/exercise.type';
import { CreateExercise } from '@/type/exercise.type';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/AddOutlined';
import ExerciseModal from '@/app/exercises/exercise-modal';
import Grid from '@mui/material/Unstable_Grid2';
import { ExerciseCard } from '@/app/exercises/exercise-card';
import { AppContextType, useAppContext } from '@/context/app-provider';
import { Component } from '@/type/component.type';
import toast from 'react-hot-toast';
import IconButton from '@mui/material/IconButton';
import ExerciseChips from '@/component/exercise-chips';
import { FitcodeApi } from '@/util/api';
import { ObjectUtil } from '@/util/object';
import { FirebaseStorage, Firestore } from '@/util/firebase';
import { PaginateOptions } from '@/type/paginate.type';
import Stack from '@mui/material/Stack';

const EMPTY_EXERCISE: CreateExercise = {
  name: '',
  componentIds: [],
  attributeValues: {},
};

function Page() {
  // global context
  const { token, components, attributes } = useAppContext() as AppContextType;

  // filter exercises
  const [component, setComponent] = useState<Component>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState({ name: '' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 6, pages: 1, total: 0 });

  // add and edit modals and exercise state
  const [modal, setModal] = useState({ add: false, edit: false });
  const [exercise, setExercise] = useState<CreateExercise>(EMPTY_EXERCISE);

  /**
   * Upload file
   */
  async function onFileUpload(file: File, path: string) {
    try {
      await FirebaseStorage.uploadFile(file, path);
    } catch (e) {
      console.log('error:', e);
      toast.error(e.message || 'An error occurred');
    }
  }

  /**
   * Add exercise
   */
  async function addExercise(item: CreateExercise) {
    try {
      const attributeValues: Record<string, any> = {};

      // find all nested select attributes and convert them to a multi-level object
      const nestedSelectAttributes = attributes
        .filter((attribute) => attribute.type === 'select' && typeof attribute.values?.[0] === 'object')
        .map((attribute) => attribute.field);

      for (const key of nestedSelectAttributes) {
        const nested = ObjectUtil.nestObject(item.attributeValues, key);
        if (nested) attributeValues[key] = nested;
      }

      // add all other attributes
      const otherAttributes = attributes.filter((attribute) => !nestedSelectAttributes.includes(attribute.field));
      for (const attribute of otherAttributes)
        attributeValues[attribute.field] = item.attributeValues?.[attribute.field];

      // delete all keys with undefined values
      Object.keys(attributeValues).forEach((key) => attributeValues[key] === undefined && delete attributeValues[key]);

      const response = await FitcodeApi.createExercise({
        name: item.name,
        componentIds: item.componentIds,
        imageUrl: item.imageUrl,
        videoUrl: item.videoUrl,
        attributeValues,
      }, token);

      toast.success('Exercise added');

      const { id, rootComponentIds } = response;
      if (!component || component && rootComponentIds.includes(component.id))
        setExercises([...exercises, { ...item, id } as Exercise]);
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

      const paginate: PaginateOptions<Exercise> = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        limit: 100,
      };

      const response = await FitcodeApi.findAllExercises(token, filter, paginate);
      setExercises(response);
    }

    fetchExercises().then();
  }, [pagination, search, component?.id]);

  /**
   * Populate exercise attributes
   */
  useEffect(() => {
    if (!exercise.id) return;

    async function populateExercise() {
      try {
        const response = await FitcodeApi.getExercise(exercise.id!, token);
        setExercise(Firestore.populateExercise(response));
      } catch (e) {
        toast.error(e.message || 'Could not fetch exercise');
      }
    }

    populateExercise().then();
  }, [exercise?.id]);

  /**
   * Get page meta for exercises when component or search name changes
   */
  useEffect(() => {
    async function fetchPageMeta() {
      try {
        const response = await FitcodeApi.getExercisePageMeta(token, {
          name: search.name,
          ...(component && { componentIds: [component?.id || ''] }),
        }, pagination.pageSize);

        setPagination({
          ...pagination,
          pages: response.pages,
          total: response.total,
        });
      } catch (e) {
        toast.error(e.message || 'Could not fetch page meta');
      }
    }

    fetchPageMeta().then();
  }, [search.name, pagination.pageSize, component?.id]);

  return (
    <Box py={2}>
      <Box display="flex" justifyContent="space-between" my={2}>
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
            setExercise(EMPTY_EXERCISE);
          }}>
            <AddIcon />
          </IconButton>
        </Box>
      </Box>

      <Stack direction="row" justifyContent="center" my={2}>
        <Pagination
          count={pagination.pages}
          color="secondary"
          onChange={(e, page) => setPagination({ ...pagination, page })}
          page={pagination.page}
        />
      </Stack>

      <Grid container spacing={2} mb={10}>
        {exercises.map((exercise) => (
          <Grid
            key={exercise.id}
            xs={4}
            sx={{ cursor: 'pointer' }}
            onClick={() => {
              setModal({ ...modal, edit: true });
              setExercise(exercise as CreateExercise);
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
        attributes={attributes}
        components={components.leafs}
        isOpen={modal.add}
        setIsOpen={(isOpen) => setModal({ ...modal, add: isOpen })}
        title={'Add Exercise'}
        onFileUpload={onFileUpload}
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
        attributes={attributes}
        components={components.leafs}
        isOpen={modal.edit}
        setIsOpen={(isOpen) => setModal({ ...modal, edit: isOpen })}
        title={'Update Exercise'}
        onFileUpload={onFileUpload}
        icons={<>
          <IconButton onClick={() => {
          }}>
            <AddIcon />
          </IconButton>
        </>}
      />
    </Box>
  );
}

export default withAuth(Page);
