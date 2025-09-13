import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

import { useAuthenticatedAuth } from './auth.provider';
import { useMain } from './main.provider';
import type {
  GroupContextProps,
  TrainerDayViewContextProps,
} from '@/app/(trainer)/groups/[group_id]/props';
import { CommonService } from '@/common/service/common.service';
import type { Day } from '@/common/service/util/date.util';
import type { Pagination } from '@/common/type/paginate.type';
import type { ChildrenProps } from '@/common/type/props.type';
import { handleApiRequest } from '@/common/type/state.type';
import { Controller } from '@/controller/controller';
import { ExerciseService } from '@/controller/exercise/exercise.service';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { Workload } from '@/controller/training/type/workload.type';
import type { User, UserEntity } from '@/controller/user/type/user.type';
import type { WellnessZScore } from '@/controller/user/type/wellness.type';

const commonService = CommonService.instance;

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
  const { token } = useAuthenticatedAuth();
  const controller = Controller.getInstance(token);

  // filtering selected component exercises
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 6,
    pages: 1,
    total: 0,
  });

  const [day, setDay] = useState<Day>(commonService.date.getToday());

  // check if it's after 12:00, then set to PM, else AM
  const [selectedPeriod, setSelectedPeriod] = useState<
    { key: Date; value: 'AM' | 'PM' } | undefined
  >(undefined);

  const [training, setTraining] = useState<Training | undefined>();
  const [component, setComponent] = useState<TrainingComponent | undefined>();
  const [supersets, setSupersets] = useState<Superset[]>([]);
  const [members, setMembers] = useState<UserEntity[]>([]);

  const [wellness, setWellness] = useState<WellnessZScore[]>([]);

  const [selectedExercises, setSelectedExercises] = useState<
    TrainingExercise[]
  >([]);
  const [selectedAthlete, setSelectedAthlete] = useState<User | undefined>();
  const [selectedSubgroup, setSelectedSubgroup] = useState<Subgroup | null>(
    null
  );

  const [
    selectedAthleteCompletedWorkloads,
    setSelectedAthleteCompletedWorkloads,
  ] = useState<Workload[]>([]);

  const isSettingAthleteWorkloads = useRef(false);
  const previousSelectedAthlete = useRef<User | undefined>(undefined);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSubgroup) setSupersets(selectedSubgroup.supersets);
    else if (component) {
      setSupersets(component.supersets);
    } else setSupersets([]);
  }, [selectedSubgroup, component]);

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
        () => controller.institution.findAthletes(group.institutionId),
        (members) => setMembers(members),
        undefined
      );
    }

    async function fetchWellness() {
      handleApiRequest(
        router,
        () => controller.user.getWellnessByInstitutionId(group.institutionId),
        (wellness) => setWellness(wellness),
        undefined
      );
    }

    fetchMembers().then();
    fetchWellness().then();
  }, [group.institutionId]);

  /**
   * Reset selected training and its children on certain changes
   */
  useEffect(() => {
    // setSelectedSubgroup(null);
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
    day,
    setDay,
    training,
    setTraining,
    selectedPeriod,
    setSelectedPeriod,
    component,
    setComponent,
    wellness,
    setWellness,
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
    selectedAthleteCompletedWorkloads,
    setSelectedAthleteCompletedWorkloads,
    isSettingAthleteWorkloads,
    previousSelectedAthlete,
    loading,
    setLoading,
  };

  return (
    <TrainerDayViewContext.Provider value={value}>
      {children}
    </TrainerDayViewContext.Provider>
  );
}
