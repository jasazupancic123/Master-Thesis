import { useEffect, useState } from 'react';

import type {
  UseExerciseFormComponentExercisesProps,
  UseExerciseFormComponentExercisesReturnType,
} from './use-component-exercises';
import { handlePaginateExercises } from '@/app/(trainer)/dashboard/exercises/state';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { AttributeFilters } from '@/sites/exercises.page';
import { useMain } from '@/store/main.provider';
import { useTrainerDayViewContext } from '@/store/trainer-day-view.provider';

export default function useExerciseFormFilters(
  props: UseExerciseFormComponentExercisesProps & {
    useExerciseFormComponentExercises: UseExerciseFormComponentExercisesReturnType;
  }
) {
  const { components } = useMain();

  const {
    filteredExercises: exercises,
    pagination,
    setPagination,
  } = useTrainerDayViewContext();

  const { component, useExerciseFormComponentExercises } = props;

  const { componentExercises } = useExerciseFormComponentExercises;

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
