import { SetState } from '@/common/type/state.type';
import { Group } from '@/controller/group/type/group.type';

export interface AddCycleModalProps {
  token: string;
  onClose: () => void;
  selectedGroup: Group;
  setSelectedGroup: SetState<Group>;
}
