import { GroupContextProps } from '@/app/groups/[group_id]/props';
import { TrainingComponent, TrainingPlan } from '@/controller/training/type/training-plan.type';

export type AthleteTrainingExerciseCardProps = Required<
  Pick<GroupContextProps, 'token' | 'training'>
> & {
  components: TrainingPlan;
};
