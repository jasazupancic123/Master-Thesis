import { Training } from '@/controller/training/type/training.type';
import { User } from '@/controller/user/type/user.type';

export type TrainingPageProps = {
  userId: string;
  token: string;
  profile: User;
  trainings: Training[];
};
