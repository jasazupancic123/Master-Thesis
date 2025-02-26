import {
  Component,
  TreeComponent,
} from '@/controller/component/type/component.type';
import { ExerciseAttribute } from '@/controller/exercise/type/exercise-attribute.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { User } from 'firebase/auth';

export type AppContextType = {
  token: string;
  attributes: ExerciseAttribute[];
  components: {
    tree: TreeComponent[];
    flat: Component[];
    leafs: Component[];
  };
};

export type AuthContextType = {
  loading: boolean;
  user: User | null;
  role: UserRole[];
  logout: () => Promise<void>;
  hasJustLoggedIn: boolean;
  setHasJustLoggedIn: (value: boolean) => void;
};

export type TrainerContextType = {
  exercises: Exercise[];
};
