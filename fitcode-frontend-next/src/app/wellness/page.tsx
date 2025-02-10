import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { UserController } from '@/controller/user/user.controller';
import { cookies } from 'next/headers';
import WellnessPage from './wellness-page';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { notFound } from 'next/navigation';

export default async function Page() {
  // fetch data
  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_COOKIE_NAME)?.value;
  if (!token) return <div>Unauthorized</div>;

  const profile = await UserController.findMe(token);
  if (!profile) return <div>Unauthorized</div>;

  const role = profile.customClaims.role[0];
  if (![UserRole.ATHLETE].includes(role)) return notFound();

  const wellness = await UserController.getMyMeta(token);

  return <WellnessPage token={token} wellness={wellness} />;
}
