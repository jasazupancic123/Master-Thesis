import { User } from '@/type/user.type';

export interface Group {
  id: string;
  name: string;
  userId: string;
  parentId?: string | null;
  memberIds: string[];
  cycleIds: string[];
  createdAt: Date;
  validUntil: Date;

  // relations
  user?: User;
  members?: User[];
  subgroups?: Group[];
}

export interface CreateGroup {
  name: string;
  memberIds: string[];
  parentId?: string | null;
  validUntil?: Date;
}