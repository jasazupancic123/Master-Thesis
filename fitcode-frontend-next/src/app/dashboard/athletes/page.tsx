import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { GroupController } from '@/controller/group/group.controller';
import { UserController } from '@/controller/user/user.controller';
import { cookies } from 'next/headers';
import { DashboardProvider } from '@/context/dashboard-provider';
import AthletesView from './athletes';
import { Institution } from '@/controller/institution/type/institution.type';

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

  const organizations: Institution[] = [
    {
      id: '1',
      name: 'NK Maribor',
      groupIds: groups.map(g=>g.id),
      groups,
      memberIds: groups.flatMap(g=>g.membersIds),
      members: [],
      ownerId: profile.uid,
      trainerIds: [profile.uid],
      trainers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const organization: Institution = { ...organizations[0] };
  return (
    <DashboardProvider
      institutions={organizations}
      token={token}
      user={profile}
      users={users}
    >
      <AthletesView
        groups={[]}
        users={users}
        selectedGroup={selectedGroup}
        setSelectedGroup={setSelectedGroup}
        selectedOrganization={selectedOrganization}
        setSelectedOrganization={setSelectedOrganization}
      />
    </DashboardProvider>
  );
}
