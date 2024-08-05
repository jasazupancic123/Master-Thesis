import { Cycle } from '@/type/cycle.type';
import { Training } from '@/type/training.type';
import { Dayjs } from 'dayjs';

export type PageProps = {
  cycle: Cycle;
  trainings: Training[];
  setTrainings: (trainings: Training[]) => void;
  date: {
    startDate: Dayjs;
    endDate: Dayjs;
    isCustom: boolean;
  }
  setDate: (date: PageProps['date']) => void;
  setCycle: (cycle: Cycle) => void;
  refetch: () => void;
}