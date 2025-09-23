'use client';

import { useState } from 'react';

import type { ChildrenProps } from '@/common/type/props.type';
import { TrainingController } from '@/controller/training/training.controller';
import { useAthlete } from '@/store/athlete.provider';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { TrainingProvider } from '@/store/training.provider';
import { TrainingService } from '@/controller/training/training.service';
import { useMain } from '@/store/main.provider';
import { GroupService } from '@/controller/group/group.service';

export default function TrainingsInitializer(props: ChildrenProps) {
  const { children } = props;
  const { token } = useAuthenticatedAuth();
  const { trainings, reports } = useAthlete();
  const { components, exercises, methods, institutions, groups } = useMain();
  const [state, setState] = useState({ trainings, reports });

  const controller = TrainingController.getInstance(token);
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
