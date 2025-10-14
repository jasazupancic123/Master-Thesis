import { useState } from 'react';
import { AthleteTrainingCardProps } from '../athlete-training-card';
import { TrainingComponent } from '@/controller/training/type/training-component.type';

export default function useAthleteTrainingCardComponents(
  props: AthleteTrainingCardProps
) {
  const { training } = props;

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
