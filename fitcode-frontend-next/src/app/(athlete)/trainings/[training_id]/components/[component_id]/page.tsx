'use client';

import TrainingInProgress from '@/components/training-in-progress/training-in-progress';
import { useMain } from '@/store/main.provider';
import { useTraining } from '@/store/training.provider';
import Alert from '@/ui/alert';

export default function Page() {
  const { activeTraining } = useMain();
  const { trainingInProgress } = useTraining();

  if (
    !activeTraining ||
    !trainingInProgress ||
    activeTraining?.training?.id !== trainingInProgress.training?.id
  )
    return <Alert type="error" errorMessage="You cannot view this training" />;

  return <TrainingInProgress />;
}
