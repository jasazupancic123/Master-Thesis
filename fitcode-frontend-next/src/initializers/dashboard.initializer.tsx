'use client';

import { useEffect, useState } from 'react';

import { DashboardUserEditProvider } from '@/components/dashboard/context/user-edit.context';
import { Controller } from '@/core/controller';
import { TrainingService } from '@/core/training/training.service';
import type { Training } from '@/core/training/type/training.type';
import DashboardLayout from '@/sites/dashboard.layout';
import { DashboardProvider } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

type WithInstitutionProps = {
  institutionId: string;
};

function withInstitution<T>(
  Component: React.ComponentType<T & WithInstitutionProps>
) {
  return function WrappedComponent(props: T) {
    const { institutions } = useMain();
    if (institutions.length === 0) return null;
    return <Component {...props} institutionId={institutions[0]?.id} />;
  };
}

export default withInstitution(DashboardInitializer);

function DashboardInitializer({
  children,
  institutionId,
}: React.PropsWithChildren & WithInstitutionProps) {
  const { institutions, exercises } = useMain();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const controller = Controller.getInstance();

  useEffect(() => {
    async function init() {
      const trainings = await controller.training.findAll({
        institutionId: institutions[0].id,
      });

      const mapped = trainings.map((t) =>
        TrainingService.mapData(t, { exercises })
      );

      setTrainings(mapped);
    }

    init();
  }, []);

  return (
    <DashboardProvider institutionId={institutionId} trainings={trainings}>
      <DashboardUserEditProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </DashboardUserEditProvider>
    </DashboardProvider>
  );
}
