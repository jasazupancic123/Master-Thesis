import { GroupDateFilter } from '@/common/type/filter.type';
import { SetState, SetStateNullable } from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { ExerciseAttribute } from '@/controller/exercise/type/exercise-attribute.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { Subgroup } from '@/controller/training/type/subgroup.type';
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
}

export type GroupContextProps = GroupIdPageProps & {
  filter: GroupDateFilter;
  setFilter: SetState<GroupDateFilter>;
  group: Group;
  setGroup: SetState<Group>;
  cycle: Cycle | null;
  setCycle: SetStateNullable<Cycle>;
  component: Component | null;
  setComponent: SetStateNullable<Component>;
  training: Training | null;
  setTraining: SetStateNullable<Training>;
  subgroup: Subgroup | null;
  setSubgroup: SetStateNullable<Subgroup>;
  dateFrom: Dayjs;
  setDateFrom: SetState<Dayjs>;
  dateTo: Dayjs;
  setDateTo: SetState<Dayjs>;
  filteredTrainings: Training[];
  setFilteredTrainings: SetState<Training[]>;
  filteredUsers: User[];
  setFilteredUsers: SetState<User[]>;
};
