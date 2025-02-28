import {
  GroupContextProps,
  TrainerDayViewContextProps,
} from '@/app/groups/[group_id]/props';
import { Pagination } from '@/common/type/paginate.type';
import { ChildrenProps } from '@/common/type/props.type';
import { ExerciseService } from '@/controller/exercise/exercise.service';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import { Training } from '@/controller/training/type/training.type';
import { User } from '@/controller/user/type/user.type';
import { createContext, useContext, useEffect, useState } from 'react';

export const TrainerDayViewContext =
  createContext<TrainerDayViewContextProps | null>(null);

export const useTrainerDayViewContext = () =>
  useContext(TrainerDayViewContext)!;

export function TrainerDayViewProvider(
  props: GroupContextProps & ChildrenProps
) {
  const { children, components, exercises, cycle, dateFrom, dateTo } = props;

  // filtering selected component exercises
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 6,
    pages: 1,
    total: 0,
  });

  const [component, setComponent] = useState<TrainingComponent | undefined>();
  const [training, setTraining] = useState<Training | undefined>();
  const [selectedAthlete, setSelectedAthlete] = useState<User | undefined>();
  const [selectedSubgroup, setSelectedSubgroup] = useState<{
    subgroup: Subgroup | null;
    index: number;
  } | null>(null);

  /**
   * Reset selected training and its children on certain changes
   */
  useEffect(() => {
    setTraining(undefined);
    setSelectedSubgroup(null);
    setComponent(undefined);
    setSelectedAthlete(undefined);
  }, [cycle, dateFrom, dateTo]);

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
    exercises,
    component,
    setComponent,
    training,
    setTraining,
    selectedSubgroup,
    setSelectedSubgroup,
    selectedAthlete,
    setSelectedAthlete,
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
