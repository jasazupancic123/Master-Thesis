'use client';

import { useState } from 'react';

import type { ChildrenProps } from '@/common/type/props.type';
import { TrainingController } from '@/controller/training/training.controller';
import { useAthlete } from '@/store/athlete.provider';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { TrainingProvider } from '@/store/training.provider';

export default function TrainingsInitializer(props: ChildrenProps) {
  const { children } = props;
  const { token } = useAuthenticatedAuth();
  const { trainings, reports } = useAthlete();
  const [state, setState] = useState({ trainings, reports });

  const controller = TrainingController.getInstance(token);
  async function refetchTraining(trainingId: string) {
    const { training, report } = await controller.findOneById(trainingId);

    setState((prev) => ({
      ...prev,
      trainings: prev.trainings
        .filter((t) => t.id !== trainingId)
        .concat(training ? [training] : [])
        .sort(
          (a, b) => new Date(a.from).getTime() - new Date(b.from).getTime()
        ),
      reports: prev.reports
        .filter((r) => r.trainingId !== trainingId)
        .concat(report ? [report] : [])
        .sort(
          (a, b) => new Date(b.from).getTime() - new Date(a.from).getTime()
        ),
    }));
  }

  return (
    <TrainingProvider {...state} refetchTraining={refetchTraining}>
      {children}
    </TrainingProvider>
  );
}
