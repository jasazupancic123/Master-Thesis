'use client';

import { ExerciseCard } from '@/components/exercise-card';
import ExerciseChips from '@/components/exercise-chips';
import ExerciseModal from '@/components/exercise-modal';
import GroupSidebar from '@/components/group-sidebar';
import { ComponentService } from '@/controller/component/component.service';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import AddIcon from '@mui/icons-material/AddOutlined';
import { Pagination, TextField } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import React, { useEffect, useState } from 'react';
import { GroupIdPageProps } from '../props';
import { addExercise, fetchExercises, onFileUpload } from './state';

const DEFAULT_EXERCISE: Partial<Exercise> = {
  name: '',
  componentsIds: [],
  attributeValues: {},
};

export function ExercisesPage(props: GroupIdPageProps) {
  const {
    token,
    groups,
    group,
    components,
    attributes,
    exercises: allExercises,
  } = props;

  // filter exercises
  const [exercises, setExercises] = useState([...allExercises]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState({ name: '' });
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(
    null
  );
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 6,
    pages: 1,
    total: 0,
  });

  // add and edit modals and exercise state
  const [modal, setModal] = useState({ add: false, edit: false });
  const [exercise, setExercise] = useState(DEFAULT_EXERCISE);

  /**
   * Filter exercises
   */
  useEffect(() => {
    fetchExercises(
      setFilteredExercises,
      components,
      exercises,
      pagination,
      setPagination,
      selectedComponent,
      search.name
    ).then();
  }, [
    token,
    components,
    search.name,
    selectedComponent?.id,
    pagination.page,
    pagination.pageSize,
    pagination.pages,
  ]);

  return (
    <>
      <Box>
        <GroupSidebar
          groups={groups}
          selectedGroup={group}
          logout={async () => {
            console.log('Log out');
          }}
        />
      </Box>

      <Box ml={10} p={2}>
        <Box display="flex" justifyContent="space-between" my={2}>
          <ExerciseChips
            noSelectionLabel="All"
            components={ComponentService.toTree(components)}
            selected={selectedComponent}
            setSelected={(component) =>
              setSelectedComponent(component as Component)
            }
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
          onFileUpload={onFileUpload}
          icons={
            <>
              <IconButton
                onClick={() =>
                  addExercise(
                    token,
                    exercise,
                    selectedComponent,
                    filteredExercises,
                    setFilteredExercises,
                    setExercises,
                    attributes,
                    components
                  )
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
    </>
  );
}
