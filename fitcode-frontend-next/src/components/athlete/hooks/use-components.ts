import { useState } from 'react';

import { core } from '@/core/core.service';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';

export default function useAthleteTrainingCardComponents(training: Training) {
  const [selectedComponent, setSelectedComponent] =
    useState<TrainingComponent | null>(null);

  return {
    components: core.training.getComponents(training),
    selectedComponent,
    setSelectedComponent,
  };
}
