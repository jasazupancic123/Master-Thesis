'use client';

import { useState } from 'react';

import { TrainingController } from '@/core/training/training.controller';
import { TrainingService } from '@/core/training/training.service';
import { useAthlete } from '@/store/athlete.provider';
import { useMain } from '@/store/main.provider';
import { TrainingProvider } from '@/store/training.provider';

export default function TrainingsInitializer(props: React.PropsWithChildren) {
  const { children } = props;
  const { trainings, reports } = useAthlete();
  const { components, exercises, methods, institutions, groups } = useMain();
  const [state, setState] = useState({ trainings, reports });

  const controller = TrainingController.getInstance();
  async function refetchTraining(trainingId: string) {
    const { training: fetchedTraining, report: fetchedReport } =
      await controller.findOneById(trainingId);

    const training = TrainingService.mapData(fetchedTraining, {
      components,
      exercises,
      methods,
    });

    const report = TrainingService.mapReport(fetchedReport, {
      institutions,
      groups,
      components,
    });

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
