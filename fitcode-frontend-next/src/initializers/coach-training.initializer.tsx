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

  const { users, institution, exercises } = useMain();

  console.log('users', users);

  const controller = Controller.getInstance();

  useEffect(() => {
    async function init() {
      if (!users.length) return;

      const trainingId = pathname.split('/')[2];
      const training = await controller.training.findById(trainingId);
      if (!institution || !training) return notFound();

      const group = groups.find((g) => g.id === training.groupId);
      if (!group) return notFound();

      const mapped = TrainingService.mapData(training, { exercises, users });
      console.log('mapped training', mapped);
      const context: TrainingIdPageProps = {
        training: mapped,
        institution,
        group,
      };

      setState(context);
    }

    init();
  }, [users]);

  if (!state) {
    console.log('Loading in coach-training.initializer.tsx');
    return <Alert type="loading" />;
  }

  return <CoachTrainingProvider {...state}>{children}</CoachTrainingProvider>;
}
