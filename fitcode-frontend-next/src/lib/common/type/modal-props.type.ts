import type { SetState } from '@/lib/common/type/state.type';

export interface ModalProps {
  open: boolean;
  setOpen: SetState<boolean>;
}
