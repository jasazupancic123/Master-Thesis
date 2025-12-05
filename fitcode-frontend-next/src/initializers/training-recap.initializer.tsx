'use client';

import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { TrainingController } from '@/core/training/training.controller';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import type { Workload } from '@/core/training/type/workload.type';
import { useCoachTraining } from '@/store/coach-training.provider';
import { TrainingRecapProvider } from '@/store/training-recap.provider';
import Alert from '@/ui/alert';

export default function TrainingRecapInitializer({
  children,
}: React.PropsWithChildren) {
  const pathname = usePathname();
  const { training } = useCoachTraining();

  const [state, setState] = useState<{
    workloads: Workload[];
    component: TrainingComponent;
  }>();

  useEffect(() => {
    async function init() {
      const componentId = pathname.split('/')[4];

      const component = training.components.find(
        (comp) => comp.id === componentId
      );

      if (!component) return;

      const workloads = (
        (await TrainingController.getInstance().getTrainingWorkloads(
          training.id
        )) || []
      ).filter((workload) => workload.componentId === componentId);

      setState({ workloads, component });
    }

    init();
  }, [pathname, training.id]);

  if (!state) {
    console.log('Loading in training-initializer.initializer.tsx');
    return <Alert type="loading" />;
  }

  return <TrainingRecapProvider {...state}>{children}</TrainingRecapProvider>;
}
