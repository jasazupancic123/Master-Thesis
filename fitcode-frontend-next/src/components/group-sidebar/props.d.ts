import { Group } from '@/controller/group/type/group.type';

export interface TrainerGroupSidebarProps {
  group: Group | null; // selected group
  groups: Group[];
}
