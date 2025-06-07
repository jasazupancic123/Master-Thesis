// dashboard/layout.tsx
import { cookies } from 'next/headers';
import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { UserController } from '@/controller/user/user.controller';
import { InstitutionController } from '@/controller/institution/institution.controller';
import { InstitutionService } from '@/controller/institution/institution.service';
import { GroupController } from '@/controller/group/group.controller';
import DashboardLayout from '@/sites/dashboard.layout';
import { DashboardProvider } from '@/store/dashboard-provider';
import { ChildrenProps } from '@/common/type/props.type';

export default async function Layout({ children }: ChildrenProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_COOKIE_NAME)?.value;
  if (!token) return <div>Unauthorized</div>;

  const profile = await UserController.findMe(token);
  if (!profile) return <div>Unauthorized</div>;

  const role = profile.customClaims.role[0];
  const users = await UserController.findAll(token);

  const institutions = InstitutionService.mapAllUsers(
    await InstitutionController.findAllByUser(token),
    users
  );

  const selectedInstitution = institutions?.[0] ?? null;

  if (selectedInstitution) {
    const groups = await GroupController.findByInstitutionId(
      token,
      selectedInstitution.id
    );
    selectedInstitution.groups = groups;
  }

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
        <DashboardLayout>{children}</DashboardLayout>
      </DashboardProvider>
    );
  }

  return (
    <DashboardProvider
      role={role}
      token={token}
      profile={profile}
      institutions={institutions}
      selectedInstitution={selectedInstitution}
      users={users}
    >
      <DashboardLayout>{children}</DashboardLayout>
    </DashboardProvider>
  );
}
