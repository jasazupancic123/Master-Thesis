import { ArrowLeft, ArrowRight } from '@mui/icons-material';
import { Box, IconButton, Stack } from '@mui/material';
import { useEffect, useState } from 'react';

import ExercisesList from '../exercises-list/exercises-list';
import { SearchBar } from '../search-bar/search-bar';
import type { AddExerciseFormProps } from '../trainer-day-view/props';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import { useMain } from '@/store/main.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';

export default function AddExerciseForm(props: AddExerciseFormProps) {
  const { selectedExercisesIds, setSelectedExercisesIds, component } = props;
  const { exercises: allExercises } = useMain();
  const {
    filteredExercises: exercises,
    setPagination,
    search,
    setSearch,
  } = useTrainerDayViewContext();

  const [filteredExercises, setFilteredExercises] =
    useState<Exercise[]>(exercises);

  const [componentExercises, setComponentExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    if (!component) return;

    if (component.id === WARMUP_ID || component.id === COOLDOWN_ID) {
      setComponentExercises(allExercises);
      return;
    }

    setComponentExercises(
      allExercises.filter((exercise) =>
        exercise.components?.some((c) => c.parents.includes(component.id))
      )
    );
  }, [component]);

  useEffect(() => {
    if (search === '') {
      setFilteredExercises(exercises);
    }
  }, [search]);

  useEffect(() => {
    setSearch('');
    setFilteredExercises(exercises);
  }, [exercises]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      width="100%"
      maxWidth="100%"
      overflow="hidden"
    >
      {/* Search Bar */}
      <SearchBar
        placeholder="Search Exercises"
        value={search}
        handleSearchChange={(e) => {
          const filteredExercises = componentExercises.filter((exercise) =>
            exercise.name.toLowerCase().includes(e.target.value.toLowerCase())
          );
          setFilteredExercises(filteredExercises);
          setSearch(e.target.value);
        }}
        maxWidth="85%"
      />

      {/* Pagination Controls */}
      <Stack
        width="100%"
        direction="row"
        spacing={2}
        mt={2}
        alignItems="center"
        justifyContent="center"
        flexWrap="nowrap"
        px={search === '' ? 0 : 3}
      >
        <IconButton
          sx={{
            width: 40,
            height: 40,
            p: 1,
            display: search === '' ? undefined : 'none',
          }}
          onClick={() => {
            setPagination((prev) => ({
              ...prev,
              page: prev.page - 1 >= 1 ? prev.page - 1 : 1,
            }));
          }}
        >
          <ArrowLeft />
        </IconButton>

        {/* Exercise List */}
        <ExercisesList
          exercises={filteredExercises}
          addExerciseForm
          setSelectedExercisesIds={setSelectedExercisesIds}
          selectedExercisesIds={selectedExercisesIds}
        />

        <IconButton
          sx={{
            width: 40,
            height: 40,
            p: 1,
            display: search === '' ? undefined : 'none',
          }}
          onClick={() => {
            setPagination((prev) => ({
              ...prev,
              page: prev.page + 1 <= prev.pages ? prev.page + 1 : prev.pages,
            }));
          }}
        >
          <ArrowRight />
        </IconButton>
      </Stack>
    </Box>
  );
}
