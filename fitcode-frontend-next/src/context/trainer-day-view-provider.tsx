import {
  GroupContextProps,
  TrainerDayViewContextProps,
} from '@/app/groups/[group_id]/props';
import { Pagination } from '@/common/type/paginate.type';
import { ChildrenProps } from '@/common/type/props.type';
import { handleApiRequest } from '@/common/type/state.type';
import { ExerciseService } from '@/controller/exercise/exercise.service';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { GroupController } from '@/controller/group/group.controller';
import { CompletedFutureWorkloads } from '@/controller/training/type/completed-future-workloads.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import { Training } from '@/controller/training/type/training.type';
import { Workload } from '@/controller/training/type/workload.type';
import { User, UserEntity } from '@/controller/user/type/user.type';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

export const TrainerDayViewContext =
  createContext<TrainerDayViewContextProps | null>(null);

export const useTrainerDayViewContext = () =>
  useContext(TrainerDayViewContext)!;

export function TrainerDayViewProvider(
  props: GroupContextProps & ChildrenProps
) {
  const router = useRouter();
  const {
    token,
    children,
    components,
    exercises,
    cycle,
    dateFrom,
    dateTo,
    group,
  } = props;

  // filtering selected component exercises
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 6,
    pages: 1,
    total: 0,
  });

  const [members, setMembers] = useState<UserEntity[]>([]);
  const [component, setComponent] = useState<TrainingComponent | undefined>();
  const [training, setTraining] = useState<Training | undefined>();
  const [selectedAthlete, setSelectedAthlete] = useState<User | undefined>();
  const [selectedSubgroup, setSelectedSubgroup] = useState<{
    subgroup: Subgroup | null;
    index: number;
  } | null>(null);
  const [showAthleteReport, setShowAthleteReport] = useState(false);
  const [selectedAthleteWorkloads, setSelectedAthleteWorkloads] =
    useState<CompletedFutureWorkloads>({
      futureWorkloads: [],
      completedWorkloads: [],
    });
  const [customAthleteWorkloads, setCustomAthleteWorkloads] = useState<
    Workload[]
  >([]);

  const isSettingAthleteWorkloads = useRef(false);
  const previousSelectedAthlete = useRef<User | undefined>(undefined);

  useEffect(() => {
    if (selectedAthlete) {
      previousSelectedAthlete.current = selectedAthlete;
    }
  }, [selectedAthlete]);

  /**
   * Group members
   */
  useEffect(() => {
    async function fetchMembers() {
      handleApiRequest(
        router,
        () => GroupController.findMembers(token, group.id),
        (members) => setMembers(members),
        undefined
      );
    }

    fetchMembers().then();
  }, [group.id]);

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
    exercises: exercises.map((e) => {
      return ExerciseService.mapComponents(e, components);
    }),
    members,
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
    showAthleteReport,
    setShowAthleteReport,
    selectedAthleteWorkloads,
    setSelectedAthleteWorkloads,
    customAthleteWorkloads,
    setCustomAthleteWorkloads,
    isSettingAthleteWorkloads,
    previousSelectedAthlete,
  };

  return (
    <TrainerDayViewContext.Provider value={value}>
      {children}
    </TrainerDayViewContext.Provider>
  );
}
