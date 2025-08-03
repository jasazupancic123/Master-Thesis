import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

import { useMain } from './main-provider';
import type {
  GroupContextProps,
  TrainerDayViewContextProps,
} from '@/app/(trainer)/groups/[group_id]/props';
import type { Pagination } from '@/common/type/paginate.type';
import type { ChildrenProps } from '@/common/type/props.type';
import { handleApiRequest } from '@/common/type/state.type';
import { ExerciseService } from '@/controller/exercise/exercise.service';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import { InstitutionController } from '@/controller/institution/institution.controller';
import type { CompletedFutureWorkloads } from '@/controller/training/type/completed-future-workloads.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { Workload } from '@/controller/training/type/workload.type';
import type { User, UserEntity } from '@/controller/user/type/user.type';

export const TrainerDayViewContext =
  createContext<TrainerDayViewContextProps | null>(null);

export const useTrainerDayViewContext = () =>
  useContext(TrainerDayViewContext)!;

export function TrainerDayViewProvider(
  props: GroupContextProps & ChildrenProps
) {
  const { children, cycle, dateFrom, dateTo, group } = props;

  const router = useRouter();
  const { components, exercises } = useMain();

  // filtering selected component exercises
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 6,
    pages: 1,
    total: 0,
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');

  const [training, setTraining] = useState<Training | undefined>();
  const [component, setComponent] = useState<TrainingComponent | undefined>();
  const [selectedExercises, setSelectedExercises] = useState<
    TrainingExercise[]
  >([]);
  const [members, setMembers] = useState<UserEntity[]>([]);
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
  const [supersets, setSupersets] = useState<Superset[]>([]);

  const isSettingAthleteWorkloads = useRef(false);
  const previousSelectedAthlete = useRef<User | undefined>(undefined);

  useEffect(() => {
    if (selectedSubgroup?.subgroup)
      setSupersets(selectedSubgroup.subgroup.supersets);
    else if (component) {
      setSupersets(component.supersets);
    } else setSupersets([]);
  }, [selectedSubgroup, selectedSubgroup?.subgroup, component]);

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
        () => InstitutionController.findAthletes(group.institutionId),
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
    setSelectedExercises([]);
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
    training,
    setTraining,
    selectedPeriod,
    setSelectedPeriod,
    component,
    setComponent,
    selectedExercises,
    setSelectedExercises,
    supersets,
    setSupersets,
    members,
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
