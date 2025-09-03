'use client';

import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

import Alert from '../components/alert/alert';
import type { GroupIdPageProps } from '@/app/(trainer)/groups/[group_id]/props';
import type { ChildrenProps } from '@/common/type/props.type';
import { GroupController } from '@/controller/group/group.controller';
import { InstitutionController } from '@/controller/institution/institution.controller';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { useAuth } from '@/store/auth-provider';
import { GroupProvider } from '@/store/group-provider';
import { useMain } from '@/store/main-provider';

interface GroupsInitializerProps extends ChildrenProps {
  params: Promise<{
    group_id: string;
  }>;
}

export default function GroupInitializer({
  children,
  params,
}: GroupsInitializerProps) {
  const [state, setState] = useState<GroupIdPageProps | null>(null);

  const { components, exercises, methods } = useMain();
  const { token } = useAuth();

  useEffect(() => {
    async function init() {
      const groupId = (await params).group_id;
      const group = await GroupController.findById(groupId, token!);
      if (!group) return notFound();

      const [groups, institution, trainings] = await Promise.all([
        GroupController.findAll(),
        InstitutionController.findById(group.institutionId),
        TrainingController.findAll({ groupId }),
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
