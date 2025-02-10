import { Group } from '@/controller/group/type/group.type';

export interface Props {
  groups: Group[];
  selectedGroup: Group | null;
  logout: () => Promise<void>;
}
