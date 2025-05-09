'use server';

import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { GroupController } from '@/controller/group/group.controller';
import { UserController } from '@/controller/user/user.controller';
import { cookies } from 'next/headers';
import Dashboard from './dashboard';
import { DashboardProvider } from '@/context/dashboard-provider';
import { Organization } from '@/controller/organization/type/organization.type';

export default async function Page() {
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

  const organizations: Organization[] = [
    {
      id: '1',
      name: 'NK Maribor',
      manager: { ...profile },
      // trainers: Array.from({ length: 12 }, () => ({ ...profile })),
      trainers: [{ ...profile }],
      groups: groups,
      // groups: Array.from({ length: 24 }, () => ({ ...groups[0] })),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const organization: Organization = { ...organizations[0] };
  return (
    <DashboardProvider>
      <Dashboard
        organization={organization}
        organizations={organizations}
        role={role}
        users={users}
        token={token}
        profile={profile}
      />
    </DashboardProvider>
  );
}
