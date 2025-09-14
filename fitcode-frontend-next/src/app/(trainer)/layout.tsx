import { isAthlete } from '@/common/firebase/firebase-auth.util';
import type { ChildrenProps } from '@/common/type/props.type';
import { getAuthIdTokenFromCookies } from '@/common/util/auth.util';
import Alert from '@/components/alert/alert';
import { Controller } from '@/controller/controller';
import { CoachMainProvider } from '@/store/main.provider';

export default async function Layout({ children }: ChildrenProps) {
  const token = await getAuthIdTokenFromCookies();
  if (!token) return <Alert type="unauthorized" />;

  const controller = Controller.getInstance(token);
  const profile = await controller.auth.findMe();
  if (!profile) return <Alert type="unauthorized" />;

  if (isAthlete(profile.customClaims.role[0]))
    return <Alert type="unauthorized" />;

  const data = await controller.app.init();
  return <CoachMainProvider {...data}>{children}</CoachMainProvider>;
}
