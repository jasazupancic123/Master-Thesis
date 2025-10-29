'use client';

import { notFound, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import Alert from '../ui/alert';
import type { GroupIdPageProps } from '@/app/(trainer)/groups/[group_id]/props';
import { Controller } from '@/core/controller';
import { TrainingService } from '@/core/training/training.service';
import { GroupProvider } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';

export default function GroupInitializer({
  children,
}: React.PropsWithChildren) {
  const pathname = usePathname();
  const [state, setState] = useState<GroupIdPageProps | null>(null);

  const { components, exercises, methods, groups, institutions } = useMain();
  const controller = Controller.getInstance();

  useEffect(() => {
    async function init() {
      const groupId = pathname.split('/')[2];
      const group = groups.find((g) => g.id === groupId);
      if (!group) return notFound();

      const institution = institutions.find(
        (i) => i.id === group.institutionId
      );

      if (!institution) return notFound();

      const trainings = await controller.training.findAll({ groupId });
      const mapped = trainings.map((t) =>
        TrainingService.mapData(t, {
          components,
          exercises,
          methods,
        })
      );

      const context: GroupIdPageProps = {
        group,
        institution,
        trainings: mapped,
      };

      setState(context);
    }

    init();
  }, []);

  if (!state) return <Alert type="loading" />;

  return <GroupProvider {...state}>{children}</GroupProvider>;
}
