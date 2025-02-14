import { SetState } from '@/common/type/state.type';
import { Cycle } from '@/controller/group/type/cycle.type';
import { Group } from '@/controller/group/type/group.type';

export interface MultiCycleSliderProps {
  token: string;
  groupId: string;
  cycles: Cycle[];
  selectedGroup: Group;
  setSelectedGroup: SetState<Group>;
  selectedCycle: Cycle | null;
  setSelectedCycle: SetState<Cycle | null>;
  setShowAddCycleModal: SetState<boolean>;
}
