import { User } from '@/type/user.type';
import { Cycle } from '@/type/cycle.type';

export interface Group {
  id: string;
  name: string;
  userId: string;
  memberIds: string[];
  cycleIds: string[];
  createdAt: Date;

  // relations
  user?: User;
  members?: User[];
  cycles?: Cycle[];
}

export interface CreateGroup {
  name: string;
  memberIds: string[];
}