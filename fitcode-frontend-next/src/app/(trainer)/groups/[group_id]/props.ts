import type { Dayjs } from 'dayjs';

import type { AuthUser } from '@/core/auth/type/user.type';
import type { Exercise } from '@/core/exercise/type/exercise.type';
import type { Cycle } from '@/core/group/type/cycle.type';
import type { Group } from '@/core/group/type/group.type';
import type { Institution } from '@/core/institution/type/institution.type';
import type { WellnessZScore } from '@/core/profile/type/wellness.type';
import type { MainSet } from '@/core/training/enum/main-set.enum';
import type { Subgroup } from '@/core/training/type/subgroup.type';
import type { Superset } from '@/core/training/type/superset.type';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { TrainingExercise } from '@/core/training/type/training-exercise.type';
import type {
  UserProgress,
  Workload,
} from '@/core/training/type/workload.type';
import type { Day } from '@/lib/common/service/date.util';
import type { GroupDateFilter } from '@/lib/common/type/filter.type';
import type { Pagination } from '@/lib/common/type/paginate.type';
import type { SetState, SetStateNullable } from '@/lib/common/type/state.type';

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
  selectedGroup: Group;
  setSelectedGroup: SetState<Group>;
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
  filteredUsers: AuthUser[];
  setFilteredUsers: SetState<AuthUser[]>;
  detectedChanges: boolean;
  setDetectedChanges: SetState<boolean>;
};

export type TrainerDayViewContextProps = {
  day: Day;
  setDay: SetState<Day>;
  training: Training | undefined;
  setTraining: SetStateNullable<Training>;
  progress: UserProgress[];
  selectedPeriod: { key: Date; value: 'AM' | 'PM' } | undefined; // selected period for the training
  setSelectedPeriod: SetState<{ key: Date; value: 'AM' | 'PM' } | undefined>;
  component: TrainingComponent | undefined; // selected training component
  setComponent: SetStateNullable<TrainingComponent>;
  wellness: WellnessZScore[];
  setWellness: SetState<WellnessZScore[]>;
  selectedExerciseIds: string[]; // selected exercises in the component
  setSelectedExerciseIds: SetState<string[]>;
  supersets: Superset[]; // supersets of the selected component
  setSupersets: SetState<Superset[]>;
  selectedAthlete: AuthUser | undefined;
  setSelectedAthlete: SetStateNullable<AuthUser>;
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
  previousSelectedAthlete: React.RefObject<AuthUser | undefined>;
  loading: boolean;
  setLoading: SetState<boolean>;
  handleAddMember: (user: AuthUser) => Promise<void>;
  handleRemoveMember: (user: AuthUser) => Promise<void>;
  addTrainingExercises: (
    exercises: TrainingExercise[],
    mainSet: MainSet
  ) => void;
  deleteSupersetExercise: (
    exerciseId: string,
    supersetIndex: number,
    exerciseIndex: number
  ) => void;
};
