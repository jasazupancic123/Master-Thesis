import type { User } from 'firebase/auth';

import type { SetState } from './state.type';
import type { Attribute } from '@/controller/attribute/type/attribute.type';
import type {
  Component,
  TreeComponent,
} from '@/controller/component/type/component.type';
import type { Exercise } from '@/controller/exercise/type/exercise.type';
import type { UserRole } from '@/controller/user/enum/user-role.enum';
import type {
  User as CustomUser,
  UserEntity,
} from '@/controller/user/type/user.type';

export type CommonContextType = {
  user: CustomUser;
};

export type DetectChangesContextType = {
  detectedChanges: boolean;
  setDetectedChanges: SetState<boolean>;
};

export type AppContextType = {
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
  setUser: SetState<User | null>;
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
