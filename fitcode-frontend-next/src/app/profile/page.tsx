import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { UserController } from '@/controller/user/user.controller';
import { cookies } from 'next/headers';
import ProfilePage from '../../sites/profile.page';

export default async function Page() {
  // fetch data
  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_COOKIE_NAME)?.value;
  if (!token) return <div>Unauthorized</div>;

  const profile = await UserController.findMe(token);
  if (!profile) return <div>Unauthorized</div>;

  return <ProfilePage token={token} user={profile} />;
}
