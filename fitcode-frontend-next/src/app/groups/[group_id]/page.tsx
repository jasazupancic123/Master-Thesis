import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { GroupProvider } from '@/context/group-provider';
import { ComponentController } from '@/controller/component/component.controller';
import { ExerciseController } from '@/controller/exercise/exercise.controller';
import { GroupController } from '@/controller/group/group.controller';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { UserController } from '@/controller/user/user.controller';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { GroupIdPageParams, GroupIdPageProps } from './props';
import TrainerGroupPage from './trainer-group-page';
import { AttributeController } from '@/controller/attribute/attribute.controller';
import { MethodController } from '@/controller/method/method.controller';

export default async function Page(props: GroupIdPageParams) {
  // fetch data
  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_COOKIE_NAME)?.value;
  if (!token) return <div>Unauthorized</div>;

  const profile = await UserController.findMe(token);
  if (!profile) return <div>Unauthorized</div>;

  const role = profile.customClaims.role[0];
  if (![UserRole.TRAINER, UserRole.MANAGER].includes(role))
    return <div>Unauthorized</div>;

  const groupId = (await props.params).group_id; // https://nextjs.org/docs/messages/sync-dynamic-apis
  const group = await GroupController.findById(token, groupId);
  if (!group) return notFound();

  if ([UserRole.ATHLETE, UserRole.ADMIN].includes(role)) return notFound();

  const [users, groups, exercises, attributes, components, trainings, methods] =
    await Promise.all([
      UserController.findAll(token),
      GroupController.findAll(token),
      ExerciseController.findAll(token),
      AttributeController.findAll(),
      ComponentController.findAll(),
      TrainingController.findAll(token, { groupId }),
      MethodController.findAll(token),
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
    token,
    userId: profile.uid,
    group,
    users,
    groups,
    exercises,
    attributes,
    components,
    trainings: mappedTrainings,
    methods,
  };

  const mapper: Record<UserRole, ReactNode> = {
    [UserRole.ADMIN]: null,
    [UserRole.ATHLETE]: null,
    [UserRole.MANAGER]: <div>Manager</div>,
    [UserRole.TRAINER]: <TrainerGroupPage />,
  };

  return <GroupProvider {...context}>{mapper[role]}</GroupProvider>;
}
