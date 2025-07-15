import { SetState } from '@/common/type/state.type';
import { Attribute } from '@/controller/attribute/type/attribute.type';
import { Component } from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { User } from '@/controller/user/type/user.type';

export interface ExercisePageProps {
  exercises: Exercise[];
  attributes: Attribute[];
  components: Component[];
  profile: User;
}

export interface ExerciseContextProps extends ExercisePageProps {
  setExercises: SetState<Exercise[]>;
  setAttributes: SetState<Attribute[]>;
}
