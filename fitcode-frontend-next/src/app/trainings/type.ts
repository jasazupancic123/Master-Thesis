import { Training } from '@/controller/training/type/training.type';
import { User } from '@/controller/user/type/user.type';

export type TrainingPageProps = {
  token: string;
  profile: User;
  trainings: Training[];
};
