import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { UserController } from '@/controller/user/user.controller';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ExercisesPage } from './exercises-page';
import { ExerciseController } from '@/controller/exercise/exercise.controller';
import { ComponentController } from '@/controller/component/component.controller';
import { GroupIdPageParams } from '../type';
import { GroupController } from '@/controller/group/group.controller';

export default async function Page({ params }: GroupIdPageParams) {
  // fetch data
  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_COOKIE_NAME)?.value;
  if (!token) return <div>Unauthorized</div>;

  const profile = await UserController.findMe(token);
  if (!profile) return <div>Unauthorized</div>;

  const role = profile.customClaims.role[0];
  if ([UserRole.ATHLETE].includes(role)) return notFound();

  const groupId = (await params).group_id; // https://nextjs.org/docs/messages/sync-dynamic-apis
  const group = await GroupController.findById(token, groupId);
  if (!group) return notFound();

  if ([UserRole.ATHLETE, UserRole.ADMIN].includes(role)) return notFound();

  const [users, groups, exercises, attributes, components] = await Promise.all([
    UserController.findAll(token),
    GroupController.findAll(token),
    ExerciseController.findAll(token),
    ExerciseController.findAttributes(),
    ComponentController.findAll(),
  ]);

  return (
    <ExercisesPage
      token={token}
      group={group}
      groups={groups}
      users={users}
      exercises={exercises}
      attributes={attributes}
      components={components}
      trainings={[]}
    />
  );
}
