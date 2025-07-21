'use client';

import { useEffect, useState } from 'react';
import Alert from '../components/alert/alert';
import { GroupIdPageProps } from '@/app/(trainer)/groups/[group_id]/props';
import { GroupController } from '@/controller/group/group.controller';
import { InstitutionController } from '@/controller/institution/institution.controller';
import { TrainingController } from '@/controller/training/training.controller';
import { notFound } from 'next/navigation';
import { TrainingService } from '@/controller/training/training.service';
import { GroupProvider } from '@/store/group-provider';
import { ChildrenProps } from '@/common/type/props.type';
import { useMain } from '@/store/main-provider';
import { UserRole } from '@/controller/user/enum/user-role.enum';

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
  const [unauthorized, setUnauthorized] = useState(false);

  const { profile, components, exercises, methods } = useMain();

  useEffect(() => {
    async function init() {
      try {
        const roles = profile.customClaims.role;

        if (
          !roles.includes(UserRole.TRAINER) &&
          !roles.includes(UserRole.MANAGER)
        )
          return setUnauthorized(true);

        const minimal = 1; // fetch minimal trainings if defined
        const groupId = (await params).group_id;
        const group = await GroupController.findById(groupId);
        if (!group) return notFound();

        const [groups, institution, trainings] = await Promise.all([
          GroupController.findAll(),
          InstitutionController.findById(group.institutionId),
          TrainingController.findAll({ groupId, minimal }),
        ]);

        const mappedTrainings = trainings.map((t) =>
          TrainingService.mapComponentsExercisesMethods(
            t,
            components,
            exercises,
            methods
          )
        );

        const context: GroupIdPageProps = {
          group,
          institution,
          groups,
          trainings: mappedTrainings,
        };

        setState(context);
      } catch (e) {
        setUnauthorized(true);
      }
    }

    init();
  }, []);

  if (!state) return <Alert type="loading" />;
  if (unauthorized) return <Alert type="unauthorized" />;

  return <GroupProvider {...state}>{children}</GroupProvider>;
}
