import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { LINK_SIGN_IN } from '@/common/constant/navigation.constant';
import { REDIRECT_TO_SIGN_IN } from '@/common/error/redirect.error';
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
import { ReactNode, Suspense } from 'react';
import { GroupIdPageParams, GroupIdPageProps } from './props';
import TrainerGroupPage from './trainer-group-page';

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

  const [users, groups, exercises, attributes, components, trainings] =
    await Promise.all([
      UserController.findAll(token),
      GroupController.findAll(token),
      ExerciseController.findAll(token),
      ExerciseController.findAttributes(),
      ComponentController.findAll(),
      TrainingController.findAll(token, { groupId }),
    ]);

  const mappedTrainings = trainings.map((t) =>
    TrainingService.mapComponents(
      TrainingService.mapExercises(t, exercises),
      components
    )
  );

  const context: GroupIdPageProps = {
    token,
    group,
    users,
    groups,
    exercises,
    attributes,
    components,
    trainings: mappedTrainings,
  };

  const mapper: Record<UserRole, ReactNode> = {
    [UserRole.ADMIN]: null,
    [UserRole.ATHLETE]: null,
    [UserRole.MANAGER]: <div>Manager</div>,
    [UserRole.TRAINER]: <TrainerGroupPage />,
  };

  return (
    <Suspense fallback={<div>Loading ...</div>}>
      <GroupProvider {...context}>{mapper[role]}</GroupProvider>
    </Suspense>
  );
}
