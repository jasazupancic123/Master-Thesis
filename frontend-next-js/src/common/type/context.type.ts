import { User } from 'firebase/auth';
import { UserRole } from '@/user/enum/user-role.enum';
import type { ExerciseAttribute } from '@/exercise/entity/exercise-attribute.entity';
import type { Component } from '@/component/entity/component.entity';
import { TreeComponent } from '@/component/type/component.type';

export type AppContextType = {
  token: string
  attributes: ExerciseAttribute[],
  components: {
    tree: TreeComponent[]
    flat: Component[]
    leafs: Component[]
  }
}

export type AuthContextType = {
  loading: boolean;
  user: User | null;
  role: UserRole[];
  logout: () => Promise<void>;
};