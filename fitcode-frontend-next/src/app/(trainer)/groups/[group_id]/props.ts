import { GroupDateFilter } from '@/common/type/filter.type';
import { Pagination } from '@/common/type/paginate.type';
import { SetState, SetStateNullable } from '@/common/type/state.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { CompletedFutureWorkloads } from '@/controller/training/type/completed-future-workloads.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { Superset } from '@/controller/training/type/superset.type';
import { TrainingExercise } from '@/controller/training/type/training-exercise.type';
import { TrainingComponent } from '@/controller/training/type/training-component.type';
import { Training } from '@/controller/training/type/training.type';
import { Workload } from '@/controller/training/type/workload.type';
import { PrescribedWorkload } from '@/controller/training/type/workload-value.type';
import { User, UserEntity } from '@/controller/user/type/user.type';
import { Dayjs } from 'dayjs';
import { TrainingInfo } from '@/controller/training/type/training.type';
import { Institution } from '@/controller/institution/type/institution.type';

export type GroupIdPageParams = { params: Promise<{ group_id: string }> };

export interface GroupIdPageProps {
  group: Group;
  institution: Institution;
  groups: Group[];
  trainings: TrainingInfo[];
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
  trainings: TrainingInfo[];
  setTrainings: SetState<TrainingInfo[]>;
  filteredUsers: User[];
  setFilteredUsers: SetState<User[]>;
  detectedChanges: boolean;
  setDetectedChanges: SetState<boolean>;
};

export type TrainerDayViewContextProps = {
  members: UserEntity[]; // group members
  training: Training | undefined;
  setTraining: SetStateNullable<Training>;
  selectedPeriod: 'AM' | 'PM'; // selected period for the training
  setSelectedPeriod: SetState<'AM' | 'PM'>;
  component: TrainingComponent | undefined; // selected training component
  setComponent: SetStateNullable<TrainingComponent>;
  selectedExercises: TrainingExercise[]; // selected exercises in the component
  setSelectedExercises: SetState<TrainingExercise[]>;
  supersets: Superset[]; // supersets of the selected component
  setSupersets: SetState<Superset[]>;
  selectedAthlete: User | undefined;
  setSelectedAthlete: SetStateNullable<User>;
  selectedSubgroup: {
    subgroup: Subgroup | null;
    index: number;
  } | null;
  setSelectedSubgroup: SetState<{
    subgroup: Subgroup | null;
    index: number;
  } | null>;
  filteredExercises: Exercise[];
  setFilteredExercises: SetState<Exercise[]>;
  pagination: Pagination;
  setPagination: SetState<Pagination>;
  search: string;
  setSearch: SetState<string>;
  showAthleteReport: boolean;
  setShowAthleteReport: SetState<boolean>;
  selectedAthleteWorkloads: CompletedFutureWorkloads;
  setSelectedAthleteWorkloads: SetState<CompletedFutureWorkloads>;
  customAthleteWorkloads: Workload[];
  setCustomAthleteWorkloads: SetState<Workload[]>;
  isSettingAthleteWorkloads: React.RefObject<boolean>;
  previousSelectedAthlete: React.RefObject<User | undefined>;
};
