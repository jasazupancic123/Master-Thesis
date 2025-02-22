import { SetState } from '@/common/type/state.type';
import { Cycle } from '@/controller/group/type/cycle.type';

export interface EditCycleModalProps {
  selectedCycle: Cycle;
  setSelectedCycle: SetState<Cycle | null>;
}
