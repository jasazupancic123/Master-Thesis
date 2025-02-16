import {
  GroupContextProps,
  GroupIdPageProps,
  TrainerDayViewContextProps,
} from '@/app/groups/[group_id]/props';
import { Pagination } from '@/common/type/paginate.type';
import { ChildrenProps } from '@/common/type/props.type';
import { ExerciseService } from '@/controller/exercise/exercise.service';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { createContext, useContext, useEffect, useState } from 'react';

export const TrainerDayViewContext =
  createContext<TrainerDayViewContextProps | null>(null);

export const useTrainerDayViewContext = () =>
  useContext(TrainerDayViewContext)!;

export function TrainerDayViewProvider(
  props: GroupContextProps & ChildrenProps
) {
  const { children, component, components, exercises } = props;

  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 9,
    pages: 1,
    total: 0,
  });

  /**
   * Filter exercises
   */
  useEffect(() => {
    if (!component) return;

    ExerciseService.paginate(
      {
        componentsIds: [component.id],
        name: search,
      },
      {
        pagination,
        components,
        exercises,
        setFilteredExercises,
        setPagination,
      }
    );
  }, [component, pagination.page]);

  const value: TrainerDayViewContextProps = {
    filteredExercises,
    setFilteredExercises,
    pagination,
    setPagination,
    search,
    setSearch,
  };

  return (
    <TrainerDayViewContext.Provider value={value}>
      {children}
    </TrainerDayViewContext.Provider>
  );
}
