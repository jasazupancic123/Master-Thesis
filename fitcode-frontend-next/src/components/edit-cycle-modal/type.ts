import { SetState } from '@/common/type/state.type';
import { Cycle } from '@/controller/group/type/cycle.type';

export interface EditCycleModalProps {
  token: string;
  onClose: () => void;
  selectedCycle: Cycle;
  setSelectedCycle: SetState<Cycle | null>;
}
