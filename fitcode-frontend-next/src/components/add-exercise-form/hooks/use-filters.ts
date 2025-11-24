import { useEffect, useState } from 'react';

import { Components } from '@/core/exercise/constant/components.constant';
import type { Component } from '@/core/exercise/type/component.type';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import { lib } from '@/lib';
import type { AttributeFilters } from '@/sites/exercises.page';
import { useMain } from '@/store/main.provider';
import { useTrainerDayView } from '@/store/trainer-day-view.provider';
import { handlePaginateExercises } from '@/core/exercise/exercise-page-state';

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
  const [componentExercises, setComponentExercises] =
    useState<Exercise[]>(exercises);

  /**
   * Filter exercises
   */
  useEffect(() => {
    const allComponentPaths = selectedComponent
      ? lib.common.tree.getNestedPaths(
          selectedComponent.field,
          Components,
          'field',
          'options'
        )
      : [];

    const filter: Partial<Exercise> = {
      ...(selectedComponent?.field &&
        !search.length && { components: allComponentPaths }),
      ...(selectedComponentsIds.length && {
        components: selectedComponentsIds,
      }),
      ...(search && { name: search }),
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

    setComponentExercises(
      allExercises.filter((exercise) =>
        exercise.components.some(
          (c) => c.split(':')[0] === selectedComponent.field
        )
      )
    );
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
