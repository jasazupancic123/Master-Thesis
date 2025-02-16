'use client';

import React, { useEffect, useState } from 'react';
import { Pagination, TextField } from '@mui/material';
import Box from '@mui/material/Box';
import AddIcon from '@mui/icons-material/AddOutlined';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { ExerciseCard } from '@/components/exercise-card';
import ExerciseChips from '@/components/exercise-chips';
import ExerciseModal from '@/components/exercise-modal';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Component } from '@/controller/component/type/component.type';
import { addExercise, fetchExercises, onFileUpload } from './state';
import { ComponentService } from '@/controller/component/component.service';
import TrainerGroupSidebar from '@/components/trainer-group-sidebar';
import { GroupIdPageProps } from '../type';
import { SearchBar } from '@/components/search-bar';
import { useScreenSize } from '@/context/screen-size-provider';
import { useTheme } from '@mui/material/styles';
import PageTitle from '@/components/page-title';

const DEFAULT_EXERCISE: Partial<Exercise> = {
  name: '',
  componentsIds: [],
  attributeValues: {},
};

export function ExercisesPage(props: GroupIdPageProps) {
  const theme = useTheme();
  const screenSize = useScreenSize();
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
        <TrainerGroupSidebar
          groups={groups}
          selectedGroup={group}
          logout={async () => {
            console.log('Log out');
          }}
        />
      </Box>

      <Box p={2}>
        <Box
          display="flex"
          justifyContent="center"
          flexDirection="column"
          alignItems="center"
          my={2}
          borderRadius={2}
          pb={1}
          bgcolor={theme.palette.background.paper}
        >
          <Box pb={1}>
            <PageTitle title="Exercises" />
          </Box>
          <ExerciseChips
            noSelectionLabel="All"
            components={ComponentService.toTree(components)}
            selected={selectedComponent}
            bgColor={theme.palette.background.default}
            primaryColor={theme.palette.primary.main}
            setSelected={(component) =>
              setSelectedComponent(component as Component)
            }
          />

          {/* Search Input */}
          <Box sx={{ py: 1 }}>
            <SearchBar
              placeholder="Search Exercises"
              value={search.name}
              handleSearchChange={(e) =>
                setSearch({ ...search, name: e.target.value })
              }
              maxWidth="100%"
            />
          </Box>

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

        <Stack direction="row" justifyContent="center" my={2} width="100%">
          <Pagination
            count={pagination.pages}
            color="primary"
            onChange={(_, page) => setPagination({ ...pagination, page })}
            page={pagination.page}
          />
        </Stack>

        <Box
          display="flex"
          flexWrap="wrap"
          justifyContent="center"
          gap={2}
          mb={10}
        >
          {filteredExercises.slice(0, 6).map((exercise, index) => (
            <Box
              key={exercise.id}
              width={{
                xs: screenSize.isMobile ? '45%' : '30%',
                sm: screenSize.isMobile ? '45%' : '30%',
              }}
              sx={{
                cursor: 'pointer',
                flexBasis: screenSize.isMobile ? '45%' : '30%',
                maxWidth: screenSize.isMobile ? '45%' : '30%',
              }}
              onClick={() => {
                setModal({ ...modal, edit: true });
                setExercise(exercise);
              }}
            >
              <ExerciseCard exercise={exercise} />
            </Box>
          ))}
        </Box>

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
