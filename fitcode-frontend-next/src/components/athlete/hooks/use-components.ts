import { useState } from 'react';

import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';

export default function useAthleteTrainingCardComponents(training: Training) {
  const [components] = useState<TrainingComponent[]>([
    training.warmup,
    ...training.components,
    training.cooldown,
  ]);

  const [selectedComponent, setSelectedComponent] =
    useState<TrainingComponent | null>(null);

  return {
    components,
    selectedComponent,
    setSelectedComponent,
  };
}
