'use client';

import { TrainingController } from '@/core/training/training.controller';
import { TrainingComponent } from '@/core/training/type/training-component.type';
import { Workload } from '@/core/training/type/workload.type';
import { useCoachTraining } from '@/store/coach-training.provider';
import { TrainingRecapProvider } from '@/store/training-recap.provider';
import Alert from '@/ui/alert';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';

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
