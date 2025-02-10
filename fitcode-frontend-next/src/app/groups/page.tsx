import { GroupController } from '@/controller/group/group.controller';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { UserController } from '@/controller/user/user.controller';
import { cookies } from 'next/headers';
import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { ReactNode } from 'react';
import TrainerPage from './trainer-page';
import { notFound } from 'next/navigation';

export default async function Page() {
  // fetch data
  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_COOKIE_NAME)?.value;
  if (!token) return <div>Unauthorized</div>;

  const profile = await UserController.findMe(token);
  if (!profile) return <div>Unauthorized</div>;

  const role = profile.customClaims.role[0];
  const [users, groups] = await Promise.all([
    UserController.findAll(token),
    GroupController.findAll(token),
  ]);

  if ([UserRole.ADMIN, UserRole.ATHLETE].includes(role)) return notFound();

  const mapper: Record<UserRole, ReactNode> = {
    [UserRole.ATHLETE]: null,
    [UserRole.ADMIN]: null,
    [UserRole.MANAGER]: <div>Manager</div>,
    [UserRole.TRAINER]: (
      <TrainerPage token={token} users={users} groups={groups} />
    ),
  };

  return mapper[role];
}
