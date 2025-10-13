import { Box, Pagination, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import ExerciseFilter from '../exercises-list/components/exercise-filter/exercise-filter';
import ExercisesList from '../exercises-list/exercises-list';
import { SearchBar } from '../../util/search-bar/search-bar';
import type { AddExerciseFormProps } from '../trainer-group-day-view/props/props';
import { handlePaginateExercises } from '@/app/(trainer)/dashboard/exercises/state';
import {
  COOLDOWN_ID,
  WARMUP_ID,
} from '@/common/constant/warmup-cooldown-ids-constants';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { AttributeFilters } from '@/sites/exercises.page';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';

export default function AddExerciseForm(props: AddExerciseFormProps) {
  const { selectedExercisesIds, setSelectedExercisesIds, component } = props;
  const { exercises: allExercises, components } = useMain();
  const {
    filteredExercises: exercises,
    pagination,
    setPagination,
  } = useTrainerDayViewContext();
  const screenSize = useScreenSize();

  const [filters, setFilters] = useState<AttributeFilters>({});
  const [openFilters, setOpenFilters] = useState(false);
  const [filteredExercises, setFilteredExercises] =
    useState<Exercise[]>(exercises);

  const [componentExercises, setComponentExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');

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

  /**
   * Filter exercises
   */
  useEffect(() => {
    const filter: Partial<Exercise> = {
      ...(component?.id && { componentIds: [component.id] }),
      ...(search && { name: search }),
      ...filters,
    };

    handlePaginateExercises(filter, {
      components,
      exercises: componentExercises,
      pagination,
      search,
      setPagination,
      setFilteredExercises,
    });
  }, [
    components,
    componentExercises,
    exercises,
    component,
    filters,
    search,
    pagination.page,
    pagination.pageSize,
    pagination.pages,
  ]);

  return (
    <Box width="100%" display="flex" flexDirection="column" alignItems="center">
      <Box
        sx={{ py: 1, width: '50%', minWidth: 240, maxWidth: 400, mx: 'auto' }}
      >
        <SearchBar
          placeholder="Search Exercises"
          value={search}
          handleSearchChange={(e) => setSearch(e.target.value)}
          maxWidth="100%"
        />
      </Box>
      <Box
        width="100%"
        display="flex"
        flexDirection={screenSize.isMobile ? 'column-reverse' : 'row'}
        alignItems="center"
        justifyContent="center"
        sx={{ m: 2 }}
      >
        <Box width="15%" />
        <Box
          width={screenSize.isMobile ? '100%' : '70%'}
          display="flex"
          justifyContent="center"
        >
          <Pagination
            size="small"
            count={pagination.pages}
            color="primary"
            page={pagination.page}
            onChange={(_, page) => setPagination((prev) => ({ ...prev, page }))}
          />
        </Box>

        {/* Filters & Results */}
        <Box
          width="15%"
          display="flex"
          justifyContent={
            screenSize.isSmallerThanLaptop ? 'center' : 'flex-end'
          }
          alignItems="center"
        >
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              alignItems: 'center',
            }}
          >
            {!screenSize.isSmallerThanLaptop && (
              <Typography variant="body2" color="text.primary">
                {pagination.total} results
              </Typography>
            )}

            <ExerciseFilter
              filters={filters}
              setFilters={setFilters}
              setPagination={setPagination}
              open={openFilters}
              setOpen={setOpenFilters}
            />
          </Box>
        </Box>
      </Box>

      <ExercisesList
        exercises={filteredExercises}
        addExerciseForm
        setSelectedExercisesIds={setSelectedExercisesIds}
        selectedExercisesIds={selectedExercisesIds}
      />
    </Box>
  );
}
