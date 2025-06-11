import { GroupDateFilter } from '@/common/type/filter.type';
import { Pagination } from '@/common/type/paginate.type';
import { SetState, SetStateNullable } from '@/common/type/state.type';
import { Attribute } from '@/controller/attribute/type/attribute.type';
import { Component } from '@/controller/component/type/component.type';
import { Method } from '@/controller/method/type/method.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { CompletedFutureWorkloads } from '@/controller/training/type/completed-future-workloads.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import { Training } from '@/controller/training/type/training.type';
import { Workload } from '@/controller/training/type/workload.type';
import { User, UserEntity } from '@/controller/user/type/user.type';
import { Dayjs } from 'dayjs';

export type GroupIdPageParams = { params: Promise<{ group_id: string }> };

export interface GroupIdPageProps {
  token: string;
  userId: string;
  group: Group;
  users: User[];
  components: Component[];
  attributes: Attribute[];
  exercises: Exercise[];
  groups: Group[];
  trainings: Training[];
  methods: Method[];
}

export type GroupContextProps = GroupIdPageProps & {
  filter: GroupDateFilter;
  setFilter: SetState<GroupDateFilter>;
  setUsers: SetState<User[]>;
  group: Group;
  setGroup: SetState<Group>;
  cycle: Cycle | undefined;
  setCycle: SetStateNullable<Cycle>;
  dateFrom: Dayjs;
  setDateFrom: SetState<Dayjs>;
  dateTo: Dayjs;
  setDateTo: SetState<Dayjs>;
  trainings: Training[];
  setTrainings: SetState<Training[]>;
  filteredTrainings: Training[];
  setFilteredTrainings: SetState<Training[]>; // filter by from & to & cycle
  filteredUsers: User[];
  setFilteredUsers: SetState<User[]>;
  detectedChanges: boolean;
  setDetectedChanges: SetState<boolean>;
};

export type TrainerDayViewContextProps = {
  members: UserEntity[]; // group members
  training: Training | undefined;
  setTraining: SetStateNullable<Training>;
  todaysTrainings: Training[];
  setTodaysTrainings: SetState<Training[]>;
  exercises: Exercise[];
  component: TrainingComponent | undefined; // selected training component
  setComponent: SetStateNullable<TrainingComponent>;
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
