'use client';

import withAuth from '@/common/components/with-auth';
import React, { useEffect, useState } from 'react';
import { Pagination, TextField } from '@mui/material';
import type { Exercise } from '@/exercise/entity/exercise.entity';
import type { CreateExercise } from '@/exercise/type/exercise.type';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/AddOutlined';
import ExerciseModal from '@/exercise/components/exercise-modal';
import Grid from '@mui/material/Unstable_Grid2';
import { ExerciseCard } from '@/exercise/components/exercise-card';
import { useAppContext } from '@/context/app-provider';
import type { Component } from '@/component/entity/component.entity';
import toast from 'react-hot-toast';
import IconButton from '@mui/material/IconButton';
import ExerciseChips from '@/exercise/components/exercise-chips';
import { PaginateOptions } from '@/common/type/paginate.type';
import Stack from '@mui/material/Stack';
import { FirebaseStorageUtil } from '@/common/service/util/firebase-storage.util';
import { CommonService } from '@/common/service/common.service';
import { ExerciseController } from '@/exercise/exercise.controller';

const DEFAULT_EXERCISE: Partial<Exercise> = {
  name: '',
  componentsIds: [],
  attributeValues: {},
};

function Page() {
  // context
  const { token, components, attributes } = useAppContext();

  // filter exercises
  const [global, setGlobal] = useState(true);
  const [component, setComponent] = useState<Component | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState({ name: '' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 6, pages: 1, total: 0 });

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
    if (!item.componentsIds?.length) return toast.error('Select at least one component');

    try {
      const attributeValues: Record<string, any> = {};

      // find all nested select attributes and convert them to a multi-level object
      const nestedSelectAttributes = attributes
        .filter((attribute) => attribute.type === 'select' && typeof attribute.values?.[0] === 'object')
        .map((attribute) => attribute.field);

      for (const key of nestedSelectAttributes) {
        const nested = CommonService.instance.object.nestObject(item.attributeValues || {}, key);
        if (nested) attributeValues[key] = nested;
      }

      // add all other attributes
      const otherAttributes = attributes.filter((attribute) => !nestedSelectAttributes.includes(attribute.field));
      for (const attribute of otherAttributes)
        attributeValues[attribute.field] = item.attributeValues?.[attribute.field];

      // delete all keys with undefined values
      Object.keys(attributeValues).forEach((key) => attributeValues[key] === undefined && delete attributeValues[key]);

      const response = await ExerciseController.createExercise(token, {
        name: item.name,
        componentsIds: item.componentsIds,
        imageUrl: item.imageUrl,
        videoUrl: item.videoUrl,
        attributeValues,
      });

      toast.success('Exercise added');

      const { id, rootComponentIds } = response;
      if (!component || component && rootComponentIds.includes(component.id))
        setExercises([...exercises, { ...item, id } as Exercise]);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'An error occurred');
    }
  }

  /**
   * Filter exercises
   */
  useEffect(() => {
    async function fetchExercises() {
      const filter = {
        global,
        ...(component?.id && { componentsIds: [component?.id || ''] }),
      };

      const paginate: PaginateOptions<Exercise> = {
        orderBy: { field: 'name', value: 'asc' },
        page: pagination.page,
        pageSize: pagination.pageSize,
      };

      const { total, data } = await ExerciseController.findExercises(token, { ...filter, ...paginate });

      // populate exercises
      const populated = await Promise.all(data.map(async (exercise) =>
        await CommonService.instance.firebase.firestore.populateExercise(exercise),
      ));

      setExercises(populated);
      setPagination(prev => ({ ...prev, total, pages: Math.ceil(total / pagination.pageSize) }));
    }

    fetchExercises().then();
  }, [pagination.page, pagination.pageSize, component?.id, token, global]);

  return (
    <Box py={12}>
      <Box display="flex" justifyContent="space-between" my={2}>
        <ExerciseChips
          global={global}
          setGlobal={setGlobal}
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
            setExercise(DEFAULT_EXERCISE);
          }}>
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
