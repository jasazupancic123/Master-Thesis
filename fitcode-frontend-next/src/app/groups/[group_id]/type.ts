import { SetState } from '@/common/type/state.type';
import { Component } from '@/controller/component/type/component.type';
import { ExerciseAttribute } from '@/controller/exercise/type/exercise-attribute.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { Group } from '@/controller/group/type/group.type';
import { User } from '@/controller/user/type/user.type';

export type GroupIdPageParams = { params: { group_id: string } };

export interface GroupIdPageProps {
  token: string;
  groupId: string;
  users: User[];
  groups: Group[];
  exercises: Exercise[];
  attributes: ExerciseAttribute[];
  components: Component[];
}
