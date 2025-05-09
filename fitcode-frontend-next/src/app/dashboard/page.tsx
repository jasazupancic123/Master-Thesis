import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { UserController } from '@/controller/user/user.controller';
import { cookies } from 'next/headers';
import Dashboard from './dashboard';
import {
  DashboardPageProps,
  DashboardProvider,
} from '@/context/dashboard-provider';
import { InstitutionController } from '@/controller/institution/institution.controller';
import { UserRole } from '@/controller/user/enum/user-role.enum';

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_COOKIE_NAME)?.value;
  if (!token) return <div>Unauthorized</div>;

  const user = await UserController.findMe(token);
  if (!user) return <div>Unauthorized</div>;

  const [institutions, groups] = await Promise.all([
    InstitutionController.findAllByUser(token),
    InstitutionController.findAllGroups(token),
  ]);

  const props: DashboardPageProps = {
    token,
    user,
    institutions,
    users: institutions.flatMap((i) => i.members),
  };

  const role = user.customClaims.role[0];

  return (
    <DashboardProvider {...props}>
      {role === UserRole.MANAGER ? <Dashboard /> : <>Trainer View</>}
    </DashboardProvider>
  );
}
