'use client';

import { useEffect, useState } from 'react';
import { ApiUtil } from '@/common/service/util/api.util';
import { UserController } from '@/controller/user/user.controller';
import Loading from '../components/loading/loading';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { GroupIdPageProps } from '@/app/groups/[group_id]/props';
import { GroupController } from '@/controller/group/group.controller';
import { InstitutionController } from '@/controller/institution/institution.controller';
import { ExerciseController } from '@/controller/exercise/exercise.controller';
import { AttributeController } from '@/controller/attribute/attribute.controller';
import { ComponentController } from '@/controller/component/component.controller';
import { TrainingController } from '@/controller/training/training.controller';
import { MethodController } from '@/controller/method/method.controller';
import { notFound } from 'next/navigation';
import { TrainingService } from '@/controller/training/training.service';
import { GroupProvider } from '@/store/group-provider';
import { ChildrenProps } from '@/common/type/props.type';

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

  useEffect(() => {
    async function init() {
      try {
        const profile = await UserController.findMe();

        const role = profile.customClaims.role;
        if (
          !role.includes(UserRole.TRAINER) &&
          !role.includes(UserRole.MANAGER)
        ) {
          return setUnauthorized(true);
        }

        const minimal = 1; // fetch minimal trainings if defined
        const groupId = (await params).group_id;
        const group = await GroupController.findById(groupId);
        if (!group) return notFound();

        if (role.includes(UserRole.ATHLETE) || role.includes(UserRole.ADMIN))
          return notFound();

        const [
          users,
          groups,
          institution,
          exercises,
          attributes,
          components,
          trainings,
          methods,
        ] = await Promise.all([
          UserController.findAll(),
          GroupController.findAll(),
          InstitutionController.findById(group.institutionId),
          ExerciseController.findAllGlobal(),
          AttributeController.findAll(),
          ComponentController.findAll(),
          TrainingController.findAll({ groupId, minimal }),
          MethodController.findAll(),
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
          userId: profile.uid,
          group,
          institution,
          users,
          groups,
          exercises,
          attributes,
          components,
          trainings: mappedTrainings,
          methods,
        };

        setState(context);
      } catch (e) {
        setUnauthorized(true);
      }
    }

    init();
  }, []);

  if (!state) return <Loading text="Loading..." />;
  if (unauthorized) return <Loading text="Unauthorized" />;

  return <GroupProvider {...state}>{children}</GroupProvider>;
}
