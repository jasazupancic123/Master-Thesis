'use server';

import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { GroupController } from '@/controller/group/group.controller';
import { UserController } from '@/controller/user/user.controller';
import { cookies } from 'next/headers';
import Dashboard from './dashboard';
import { DashboardProvider } from '@/context/dashboard-provider';
import { InstitutionController } from '@/controller/institution/institution.controller';
import { InstitutionService } from '@/controller/institution/institution.service';

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_COOKIE_NAME)?.value;
  if (!token) return <div>Unauthorized</div>;

  const profile = await UserController.findMe(token);
  if (!profile) return <div>Unauthorized</div>;

  const role = profile.customClaims.role[0];
  const users = await UserController.findAll(token);

  const institutions = InstitutionService.mapUsers(
    await InstitutionController.findAll(token),
    users
  );

  if (!institutions || !institutions.length) {
    return (
      <DashboardProvider
        role={role}
        token={token}
        profile={profile}
        institutions={[]}
        selectedInstitution={null}
        users={users}
      >
        <Dashboard />
      </DashboardProvider>
    );
  }

  const selectedInstitution = institutions[0];
  const groups = await GroupController.findAllByInstitution(
    token,
    selectedInstitution.id
  );

  selectedInstitution.groups = groups;

  return (
    <DashboardProvider
      role={role}
      token={token}
      profile={profile}
      institutions={institutions}
      selectedInstitution={selectedInstitution}
      users={users}
    >
      <Dashboard />
    </DashboardProvider>
  );
}
