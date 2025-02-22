import { GroupDateFilter } from '@/common/type/filter.type';
import { Pagination } from '@/common/type/paginate.type';
import { SetState, SetStateNullable } from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { ExerciseAttribute } from '@/controller/exercise/type/exercise-attribute.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
import { TrainingComponent } from '@/controller/training/type/training-plan.type';
import { Training } from '@/controller/training/type/training.type';
import { User } from '@/controller/user/type/user.type';
import { Dayjs } from 'dayjs';

export type GroupIdPageParams = { params: Promise<{ group_id: string }> };

export interface GroupIdPageProps {
  token: string;
  group: Group;
  users: User[];
  components: Component[];
  attributes: ExerciseAttribute[];
  exercises: Exercise[];
  groups: Group[];
  trainings: Training[];
  refreshUsers?: () => Promise<void>;
}

export type GroupContextProps = GroupIdPageProps & {
  filter: GroupDateFilter;
  setFilter: SetState<GroupDateFilter>;
  group: Group;
  setGroup: SetState<Group>;
  cycle: Cycle | undefined;
  setCycle: SetStateNullable<Cycle>;
  component: TrainingComponent | undefined; // selected training component
  setComponent: SetStateNullable<TrainingComponent>;
  training: Training | undefined;
  setTraining: SetStateNullable<Training>;
  selectedGroup: Group | null;
  setSelectedGroup: SetState<Group | null>;
  selectedSubgroup: {
    subgroup: Subgroup | null;
    index: number;
  } | null;
  setSelectedSubgroup: SetState<{
    subgroup: Subgroup | null;
    index: number;
  } | null>;
  dateFrom: Dayjs;
  setDateFrom: SetState<Dayjs>;
  dateTo: Dayjs;
  setDateTo: SetState<Dayjs>;
  trainings: Training[];
  setTrainings: SetState<Training[]>;
  filteredTrainings: Training[];
  setFilteredTrainings: SetState<Training[]>;
  filteredUsers: User[];
  setFilteredUsers: SetState<User[]>;
  selectedAthlete: User | undefined;
  setSelectedAthlete: SetStateNullable<User>;
  detectedChanges: boolean;
  setDetectedChanges: SetState<boolean>;
  handleUpdateGroup: () => Promise<void>;
  handleUpdateTraining: () => Promise<void>;
};

export type TrainerDayViewContextProps = {
  filteredExercises: Exercise[];
  setFilteredExercises: SetState<Exercise[]>;
  pagination: Pagination;
  setPagination: SetState<Pagination>;
  search: string;
  setSearch: SetState<string>;
};
