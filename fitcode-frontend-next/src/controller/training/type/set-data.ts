import { SetStatus } from '../enum/set-status.enum';

export interface SetData {
  status: SetStatus;
  setTypeValue?: number; // actual user reps / distance / time / ... completed
  workloadValue?: string | number; // actual user kg completed
  notes?: string;
}
