import { Attribute } from '@/controller/attribute/type/attribute.type';
import {
  Component,
  TreeComponent,
} from '@/controller/component/type/component.type';
import { Exercise } from '@/controller/exercise/type/exercise.type';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { UserEntity } from '@/controller/user/type/user.type';
import { User } from 'firebase/auth';

export type AppContextType = {
  token: string;
  attributes: Attribute[];
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
  profile: UserEntity | undefined;
  setProfile: (profile: UserEntity) => void;
};

export type TrainerContextType = {
  exercises: Exercise[];
};
