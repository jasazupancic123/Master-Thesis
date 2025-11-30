'use client';

import { notFound, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Controller } from '@/core/controller';
import { TrainingService } from '@/core/training/training.service';
import type { TrainingIdPageProps } from '@/store/coach-training.provider';
import { CoachTrainingProvider } from '@/store/coach-training.provider';
import { useMain } from '@/store/main.provider';
import Alert from '@/ui/alert';

export default function CoachTrainingInitializer({
  children,
}: React.PropsWithChildren) {
  const pathname = usePathname();

  const { groups } = useMain();

  const [state, setState] = useState<TrainingIdPageProps | null>(null);

  const { users, institutions, exercises } = useMain();
  const controller = Controller.getInstance();

  useEffect(() => {
    async function init() {
      const trainingId = pathname.split('/')[2];

      const training = await controller.training.findById(trainingId);

      if (!training) return notFound();

      const institution = institutions.find(
        (i) => i.id === training.institutionId
      );

      if (!institution) return notFound();

      const group = groups.find((g) => g.id === training.groupId);

      if (!group) return notFound();

      const mapped = TrainingService.mapData(training, { exercises, users });

      const context: TrainingIdPageProps = {
        training: mapped,
        institution,
        group,
      };

      setState(context);
    }

    init();
  }, []);

  if (!state) {
    console.log('Loading in coach-training.initializer.tsx');
    return <Alert type="loading" />;
  }

  return <CoachTrainingProvider {...state}>{children}</CoachTrainingProvider>;
}
