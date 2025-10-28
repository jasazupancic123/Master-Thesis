import { useEffect, useState } from 'react';

import { handlePaginateExercises } from '@/app/(trainer)/dashboard/exercises/state';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { AttributeFilters } from '@/sites/exercises.page';
import { useMain } from '@/store/main.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

export default function useExerciseFormFilters(
  component: TrainingComponent,
  componentExercises: Exercise[],
  selectedComponentsIds: string[]
) {
  const { components } = useMain();

  const {
    filteredExercises: exercises,
    pagination,
    setPagination,
  } = useTrainerDayView();

  const [filters, setFilters] = useState<AttributeFilters>({});

  const [openFilters, setOpenFilters] = useState(false);

  const [search, setSearch] = useState('');

  const [filteredExercises, setFilteredExercises] =
    useState<Exercise[]>(exercises);

  /**
   * Filter exercises
   */
  useEffect(() => {
    const filter: Partial<Exercise> = {
      ...(component?.id && { componentIds: [component.id] }),
      ...(search && { name: search }),
      ...(selectedComponentsIds.length && {
        componentIds: selectedComponentsIds,
      }),
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
    selectedComponentsIds,
  ]);

  return {
    filters,
    setFilters,
    openFilters,
    setOpenFilters,
    search,
    setSearch,
    filteredExercises,
    setFilteredExercises,
  };
}
