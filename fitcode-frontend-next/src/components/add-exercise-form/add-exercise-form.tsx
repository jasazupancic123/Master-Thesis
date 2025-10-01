import { Box, Grid2, Pagination, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import ExerciseFilter from '../exercises-list/exercise-filter';
import ExercisesList from '../exercises-list/exercises-list';
import type { AddExerciseFormProps } from '../trainer-day-view/props';
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

  console.log('filteredExercises', exercises);

  const [filters, setFilters] = useState<AttributeFilters>({});
  const [openFilters, setOpenFilters] = useState(false);
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

  /**
   * Filter exercises
   */
  useEffect(() => {
    const filter: Partial<Exercise> = {
      ...(component?.id && { componentIds: [component.id] }),
      ...filters,
    };

    handlePaginateExercises(filter, {
      components,
      exercises: componentExercises,
      pagination,
      setPagination,
      setFilteredExercises,
    });
  }, [
    components,
    componentExercises,
    exercises,
    component,
    filters,
    pagination.page,
    pagination.pageSize,
    pagination.pages,
  ]);

  return (
    <>
      <Grid2 container alignItems="center" spacing={2} sx={{ m: 2 }}>
        {/* Left empty space (desktop only) */}
        <Grid2
          size={{ xs: screenSize.isMobile ? 6 : 4 }}
          container
          order={1}
          justifyContent={{ xs: 'flex-end', md: 'flex-start' }}
          alignItems="center"
        />

        {/* Pagination */}
        <Grid2
          size={{ xs: screenSize.isMobile ? 12 : 4 }}
          container
          justifyContent="center"
          order={screenSize.isMobile ? 3 : 2}
        >
          <Pagination
            size="small"
            count={pagination.pages}
            color="primary"
            page={pagination.page}
            onChange={(_, page) => setPagination((prev) => ({ ...prev, page }))}
          />
        </Grid2>

        {/* Filters & Results */}
        <Grid2
          order={screenSize.isMobile ? 2 : 3}
          size={{ xs: screenSize.isMobile ? 6 : 4 }}
          container
          justifyContent={screenSize.isMobile ? 'flex-start' : 'flex-end'}
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
            {!screenSize.isMobile && (
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
        </Grid2>
      </Grid2>

      <ExercisesList
        exercises={filteredExercises}
        addExerciseForm
        setSelectedExercisesIds={setSelectedExercisesIds}
        selectedExercisesIds={selectedExercisesIds}
      />
    </>
  );
}
