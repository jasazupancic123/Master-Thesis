'use client';

import { Pagination as PaginationType } from '@/common/type/paginate.type';
import { ExerciseCard } from '@/components/exercise-card';
import ExerciseChips from '@/components/exercise-chips';
import ExerciseModal from '@/components/exercise-modal';
import GroupSidebar from '@/components/group-sidebar';
import { useGroup } from '@/context/group-provider';
import { ComponentService } from '@/controller/component/component.service';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import AddIcon from '@mui/icons-material/AddOutlined';
import { Pagination, TextField } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import {
  handleAddExercise,
  handleFileUpload,
  handlePaginateExercises,
} from './state';

const DEFAULT_EXERCISE: Partial<Exercise> = {
  name: '',
  componentsIds: [],
  attributeValues: {},
};

export function ExercisesPage() {
  const {
    token,
    groups,
    group,
    component,
    setComponent,
    components,
    attributes,
    exercises: allExercises,
  } = useGroup();

  const router = useRouter();

  // filter exercises
  const [exercises, setExercises] = useState([...allExercises]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    pageSize: 6,
    pages: 1,
    total: 0,
  });

  // modals
  const [modal, setModal] = useState({ add: false, edit: false });
  const [exercise, setExercise] = useState<Partial<Exercise>>(DEFAULT_EXERCISE);

  /**
   * Filter exercises
   */
  useEffect(() => {
    handlePaginateExercises(
      {
        ...(component?.id && {
          componentsIds: [component.id],
        }),
        ...(search && { name: search }),
      },
      {
        components,
        exercises,
        pagination,
        setPagination,
        setFilteredExercises,
      }
    );
  }, [
    token,
    components,
    search,
    component,
    pagination.page,
    pagination.pageSize,
    pagination.pages,
  ]);

  return (
    <>
      <Box>
        <GroupSidebar groups={groups} group={group} />
      </Box>

      <Box ml={10} p={2}>
        <Box display="flex" justifyContent="space-between" my={2}>
          <ExerciseChips
            noSelectionLabel="All"
            components={ComponentService.toTree(components)}
            selected={component}
            setSelected={(component) => setComponent(component as Component)}
          />

          <Box>
            {/* Search Input */}
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
          {filteredExercises.map((exercise) => (
            <Grid
              key={exercise.id}
              size={{ xs: 4 }}
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
          components={components}
          isOpen={modal.add}
          setIsOpen={(isOpen) => setModal({ ...modal, add: isOpen })}
          title={'Add Exercise'}
          onFileUpload={(file, path) =>
            handleFileUpload({ file, path }, { router })
          }
          icons={
            <>
              <IconButton
                onClick={() =>
                  handleAddExercise(token, exercise, {
                    router,
                    components,
                    attributes,
                    component,
                    filteredExercises,
                    setFilteredExercises,
                    setExercises,
                  })
                }
              >
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
          components={components}
          isOpen={modal.edit}
          setIsOpen={(isOpen) => setModal({ ...modal, edit: isOpen })}
          title={'Update Exercise'}
          onFileUpload={(file, path) =>
            handleFileUpload({ file, path }, { router })
          }
          icons={
            <>
              <IconButton onClick={() => {}}>
                <AddIcon />
              </IconButton>
            </>
          }
        />
      </Box>
    </>
  );
}
