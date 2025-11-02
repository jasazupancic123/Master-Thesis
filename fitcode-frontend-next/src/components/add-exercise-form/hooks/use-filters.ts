import { useEffect, useState } from 'react';

import { handlePaginateExercises } from '@/app/(trainer)/dashboard/exercises/state';
import type { Component } from '@/core/exercise/type/component.type';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { AttributeFilters } from '@/sites/exercises.page';
import { useMain } from '@/store/main.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';

export default function useExerciseFormFilters(
  component: TrainingComponent,
  selectedComponentsIds: string[],
  selectedComponent: Component | null
) {
  const { exercises: allExercises } = useMain();

  const {
    filteredExercises: exercises,
    pagination,
    setPagination,
  } = useTrainerDayView();

  const [filters, setFilters] = useState<AttributeFilters>({});
  const [search, setSearch] = useState('');

  const [openFilters, setOpenFilters] = useState(false);

  const [filteredExercises, setFilteredExercises] =
    useState<Exercise[]>(exercises);

  const [componentExercises, setComponentExercises] = useState<Exercise[]>([]);

  /**
   * Filter exercises
   */
  useEffect(() => {
    const filter: Partial<Exercise> = {
      ...(selectedComponent?.field &&
        !search.length && { components: [selectedComponent.field] }),
      ...(search && { name: search }),
      ...(!search.length &&
        selectedComponentsIds.length && {
          componentIds: selectedComponentsIds,
        }),
      ...filters,
    };

    handlePaginateExercises(filter, {
      exercises: componentExercises,
      pagination,
      search,
      setPagination,
      setFilteredExercises,
    });
  }, [
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

  useEffect(() => {
    if (!selectedComponent) return;

    if (search.length) {
      setComponentExercises(allExercises);
      return;
    }

    /* setComponentExercises(
      allExercises.filter((exercise) =>
        exercise.components?.some((c) =>
          c.parents.includes(selectedComponent.id)
        )
      )
    ); */
  }, [selectedComponent, search]);

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
