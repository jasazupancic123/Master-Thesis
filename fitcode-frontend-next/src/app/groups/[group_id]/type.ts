import { SetState } from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { ExerciseAttribute } from '@/controller/exercise/type/exercise-attribute.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';
import { Training } from '@/controller/training/type/training.type';
import { User } from '@/controller/user/type/user.type';

export type GroupIdPageParams = { params: { group_id: string } };

export interface GroupIdPageProps {
  token: string;
  group: Group;
  users: User[];
  groups: Group[];
  exercises: Exercise[];
  attributes: ExerciseAttribute[];
  components: Component[];
  trainings: Training[];
}

export type FilterTypeViewProps = GroupIdPageProps & {
  setSelectedGroup: SetState<Group>;
  setSelectedTrainings: SetState<Training[]>;
  selectedCycle: Cycle | null;
  setSelectedCycle: SetState<Cycle | null>;
};
