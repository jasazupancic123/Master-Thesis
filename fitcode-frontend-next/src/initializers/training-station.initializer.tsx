'use client';

import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

import { TrainingController } from '@/core/training/training.controller';
import { TrainingService } from '@/core/training/training.service';
import type { Training } from '@/core/training/type/training.type';
import { useCoachTraining } from '@/store/coach-training.provider';
import { useMain } from '@/store/main.provider';
import Alert from '@/ui/alert';
import { TrainingStationProvider } from '@/store/training-station.provider';

export default function TrainingStationInitializer({
  children,
}: React.PropsWithChildren) {
  const { exercises, users } = useMain();

  const { training } = useCoachTraining();

  const [state, setState] = useState<{
    individualTrainings: (Training & { userId: string })[];
  }>();

  useEffect(() => {
    if (!exercises.length || !users.length) return;

    async function init() {
      const individualTrainingsRecord: Record<string, Training> =
        await TrainingController.getInstance().findAllIndividual(training.id);

      if (!individualTrainingsRecord) return notFound();

      // map all trainngs

      const individualTrainings = Object.entries(individualTrainingsRecord).map(
        ([userId, training]) => {
          const mappedTraining = TrainingService.mapData(training, {
            exercises,
            users,
          });

          return { ...mappedTraining, userId };
        }
      );

      setState({ individualTrainings });
    }

    init();
  }, [exercises, users, training.id]);

  if (!state) {
    console.log('Loading in coach-training-station.initializer.tsx');
    return <Alert type="loading" />;
  }

  return (
    <TrainingStationProvider {...state}>{children}</TrainingStationProvider>
  );
}
