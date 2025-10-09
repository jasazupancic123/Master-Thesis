import { SetState } from './state.type';

export interface ModalProps {
  open: boolean;
  setOpen: SetState<boolean>;
}
