import type { Dayjs } from 'dayjs';

import type { Day } from '@/common/service/util/date.util';
import type { GroupDateFilter } from '@/common/type/filter.type';
import type { Pagination } from '@/common/type/paginate.type';
import type { SetState, SetStateNullable } from '@/common/type/state.type';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { Cycle } from '@/controller/group/type/cycle.type';
import type { Group } from '@/controller/group/type/group.type';
import type { Institution } from '@/controller/institution/type/institution.type';
import type { Subgroup } from '@/controller/training/type/subgroup.type';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import type { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import type { Workload } from '@/controller/training/type/workload.type';
import type { User, UserEntity } from '@/controller/user/type/user.type';
import type { WellnessZScore } from '@/controller/user/type/wellness.type';

export type GroupIdPageParams = { params: Promise<{ group_id: string }> };

export interface GroupIdPageProps {
  group: Group;
  institution: Institution;
  trainings: Training[];
}

export type GroupContextProps = GroupIdPageProps & {
  filter: GroupDateFilter;
  setFilter: SetState<GroupDateFilter>;
  group: Group;
  setGroup: SetState<Group>;
  institution: Institution;
  setInstitution: SetState<Institution>;
  cycle: Cycle | undefined;
  setCycle: SetStateNullable<Cycle>;
  dateFrom: Dayjs;
  setDateFrom: SetState<Dayjs>;
  dateTo: Dayjs;
  setDateTo: SetState<Dayjs>;
  trainings: Training[];
  setTrainings: SetState<Training[]>;
  filteredUsers: User[];
  setFilteredUsers: SetState<User[]>;
  detectedChanges: boolean;
  setDetectedChanges: SetState<boolean>;
};

export type TrainerDayViewContextProps = {
  members: UserEntity[]; // group members
  day: Day;
  setDay: SetState<Day>;
  training: Training | undefined;
  setTraining: SetStateNullable<Training>;
  selectedPeriod:
    | {
        key: Date;
        value: 'AM' | 'PM';
      }
    | undefined; // selected period for the training
  setSelectedPeriod: SetState<
    | {
        key: Date;
        value: 'AM' | 'PM';
      }
    | undefined
  >;
  component: TrainingComponent | undefined; // selected training component
  setComponent: SetStateNullable<TrainingComponent>;
  wellness: WellnessZScore[];
  setWellness: SetState<WellnessZScore[]>;
  selectedExercises: TrainingExercise[]; // selected exercises in the component
  setSelectedExercises: SetState<TrainingExercise[]>;
  supersets: Superset[]; // supersets of the selected component
  setSupersets: SetState<Superset[]>;
  selectedAthlete: User | undefined;
  setSelectedAthlete: SetStateNullable<User>;
  selectedSubgroup: Subgroup | null;
  setSelectedSubgroup: SetState<Subgroup | null>;
  filteredExercises: Exercise[];
  setFilteredExercises: SetState<Exercise[]>;
  pagination: Pagination;
  setPagination: SetState<Pagination>;
  search: string;
  setSearch: SetState<string>;
  selectedAthleteCompletedWorkloads: Workload[];
  setSelectedAthleteCompletedWorkloads: SetState<Workload[]>;
  isSettingAthleteWorkloads: React.RefObject<boolean>;
  previousSelectedAthlete: React.RefObject<User | undefined>;
  loading: boolean;
  setLoading: SetState<boolean>;
};
