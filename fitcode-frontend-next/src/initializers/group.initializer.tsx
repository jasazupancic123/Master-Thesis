'use client';

import { notFound, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import Alert from '../components/alert/alert';
import type { GroupIdPageProps } from '@/app/(trainer)/groups/[group_id]/props';
import type { ChildrenProps } from '@/common/type/props.type';
import { Controller } from '@/controller/controller';
import { TrainingService } from '@/controller/training/training.service';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { GroupProvider } from '@/store/group.provider';
import { useMain } from '@/store/main.provider';

export default function GroupInitializer({ children }: ChildrenProps) {
  const pathname = usePathname();
  const [state, setState] = useState<GroupIdPageProps | null>(null);

  const { components, exercises, methods } = useMain();
  const auth = useAuthenticatedAuth();
  const controller = Controller.getInstance(auth.token);

  useEffect(() => {
    async function init() {
      const groupId = pathname.split('/')[2];
      const group = await controller.group.findById(groupId);
      if (!group) return notFound();

      const [groups, institution, trainings] = await Promise.all([
        controller.group.findAll(),
        controller.institution.findById(group.institutionId),
        controller.training.findAll({ groupId }),
      ]);

      const mappedTrainings = trainings.map((t) => {
        TrainingService.mapData(t, {
          components,
          exercises,
          methods,
        });

        return t;
      });

      const context: GroupIdPageProps = {
        group,
        institution,
        groups,
        trainings: mappedTrainings,
      };

      setState(context);
    }

    init();
  }, []);

  if (!state) return <Alert type="loading" />;

  return <GroupProvider {...state}>{children}</GroupProvider>;
}
