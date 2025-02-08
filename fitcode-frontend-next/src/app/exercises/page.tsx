'use client';

import withAuth from '@/components/with-auth';
import React, { useEffect, useState } from 'react';
import { Pagination, TextField } from '@mui/material';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/AddOutlined';
import Grid from '@mui/material/Unstable_Grid2';
import { useAppContext } from '@/context/app-provider';
import toast from 'react-hot-toast';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { FirebaseStorageUtil } from '@/common/service/util/firebase-storage.util';
import { CommonService } from '@/common/service/common.service';
import { useFetch } from '@/hook/use-fetch';
import { ExerciseCard } from '@/components/exercise-card';
import ExerciseChips from '@/components/exercise-chips';
import ExerciseModal from '@/components/exercise-modal';
import { ExerciseController } from '@/controller/exercise/exercise.controller';
import { ExerciseService } from '@/controller/exercise/exercise.service';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Component } from '@/controller/component/type/component.type';

const commonService = CommonService.instance;

const DEFAULT_EXERCISE: Partial<Exercise> = {
  name: '',
  componentsIds: [],
  attributeValues: {},
};

function Page() {
  // context
  const { token, components, attributes } = useAppContext();
  const allExercises = useFetch<Exercise[]>('/exercise');

  // filter exercises
  const [component, setComponent] = useState<Component | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState({ name: '' });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 6,
    pages: 1,
    total: 0,
  });

  // add and edit modals and exercise state
  const [modal, setModal] = useState({ add: false, edit: false });
  const [exercise, setExercise] = useState(DEFAULT_EXERCISE);

  async function onFileUpload(file: File, path: string) {
    try {
      await FirebaseStorageUtil.uploadFile(file, path);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'An error occurred');
    }
  }

  async function addExercise(item: Partial<Exercise>) {
    if (!item.name) return toast.error('Name is required');
    if (!item.componentsIds?.length)
      return toast.error('Select at least one component');

    try {
      const attributeValues: Record<string, any> = {};

      // find all nested select attributes and convert them to a multi-level object
      const nestedSelectAttributes = attributes
        .filter(
          (attribute) =>
            attribute.type === 'select' &&
            typeof attribute.values?.[0] === 'object'
        )
        .map((attribute) => attribute.field);

      for (const key of nestedSelectAttributes) {
        const nested = CommonService.instance.object.nestObject(
          item.attributeValues || {},
          key
        );

        if (nested) attributeValues[key] = nested;
      }

      // add all other attributes
      const otherAttributes = attributes.filter(
        (attribute) => !nestedSelectAttributes.includes(attribute.field)
      );

      for (const attribute of otherAttributes)
        attributeValues[attribute.field] =
          item.attributeValues?.[attribute.field];

      // delete all keys with undefined values
      Object.keys(attributeValues).forEach(
        (key) =>
          attributeValues[key] === undefined && delete attributeValues[key]
      );

      const response = await ExerciseController.create(token, {
        name: item.name,
        componentsIds: item.componentsIds,
        imageUrl: item.imageUrl,
        videoUrl: item.videoUrl,
        attributeValues,
      });

      toast.success('Exercise added');

      const id = response.id;
      const rootComponents = item.componentsIds.map((cId) => {
        const component = components.flat.find((c) => c.id === cId)!;
        return commonService.tree.getRoot(component, components.flat);
      });

      if (
        !component ||
        (component && rootComponents.map((c) => c.id).includes(component.id))
      )
        setExercises([...exercises, { ...item, id } as Exercise]);

      allExercises.setData((prev) => [...prev!, { ...item, id } as Exercise]);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'An error occurred');
    }
  }

  /**
   * Filter exercises
   */
  useEffect(() => {
    if (allExercises.loading || allExercises.error || !allExercises.data)
      return;

    async function fetchExercises() {
      const filter = {
        ...(component?.id && { componentsIds: [component?.id || ''] }),
        ...(search.name && { name: search.name }),
      };

      let filtered = ExerciseService.filter(
        allExercises.data!,
        filter,
        components.flat
      );

      const total = filtered.length;

      // paginate
      const pages = Math.ceil(total / pagination.pageSize);
      const page = pages < pagination.pages ? 1 : pagination.page;
      filtered = commonService.generic.paginate(filtered, {
        page,
        pageSize: pagination.pageSize,
        orderBy: { field: 'name', value: 'asc' },
      });

      // populate exercises
      filtered.map((exercise) => {
        ExerciseService.mapAttributes(exercise);
        ExerciseService.mapComponents(exercise, components.flat);
      });

      setExercises(filtered);
      setPagination((prev) => ({ ...prev, page, total, pages }));
    }

    fetchExercises().then();
  }, [
    pagination.page,
    pagination.pageSize,
    component?.id,
    token,
    allExercises.loading,
    search.name,
    allExercises.error,
    allExercises.data,
    components,
    pagination.pages,
  ]);

  return (
    <Box py={12}>
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
          <IconButton
            onClick={() => {
              setModal({ ...modal, add: true });
              setExercise(DEFAULT_EXERCISE);
            }}
          >
            <AddIcon />
          </IconButton>
        </Box>
      </Box>

      <Stack direction="row" justifyContent="center" my={2}>
        <Pagination
          count={pagination.pages}
          color="primary"
          onChange={(_, page) => setPagination({ ...pagination, page })}
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
              setExercise(exercise);
            }}
          >
            <ExerciseCard exercise={exercise} />
          </Grid>
        ))}
      </Grid>

      {/* Add Exercise Modal*/}
      <ExerciseModal
        data={{ ...exercise, imageUrl: undefined, videoUrl: undefined }}
        setData={setExercise}
        attributes={attributes}
        isOpen={modal.add}
        setIsOpen={(isOpen) => setModal({ ...modal, add: isOpen })}
        title={'Add Exercise'}
        onFileUpload={onFileUpload}
        icons={
          <>
            <IconButton onClick={() => addExercise(exercise)}>
              <AddIcon />
            </IconButton>
          </>
        }
      />

      {/* Edit Exercise Modal */}
      <ExerciseModal
        data={exercise}
        setData={setExercise}
        attributes={attributes}
        isOpen={modal.edit}
        setIsOpen={(isOpen) => setModal({ ...modal, edit: isOpen })}
        title={'Update Exercise'}
        onFileUpload={onFileUpload}
        icons={
          <>
            <IconButton onClick={() => {}}>
              <AddIcon />
            </IconButton>
          </>
        }
      />
    </Box>
  );
}

export default withAuth(Page);
