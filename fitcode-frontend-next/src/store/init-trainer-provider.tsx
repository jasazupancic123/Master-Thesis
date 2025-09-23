// app/store/init-provider.tsx  (Server Component)
import { isAthlete } from '@/common/firebase/firebase-auth.util';
import { ChildrenProps } from '@/common/type/props.type';
import { getAuthIdTokenFromCookies } from '@/common/util/auth.util';
import Alert from '@/components/alert/alert';
import { Controller } from '@/controller/controller';
import { CoachMainProvider } from '@/store/main.provider';

const MIN_LOADING_MS = 3000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default async function InitTrainerProvider({ children }: ChildrenProps) {
  const token = await getAuthIdTokenFromCookies();
  if (!token) return <Alert type="unauthorized" />;

  const controller = Controller.getInstance(token);
  const profile = await controller.auth.findMe();
  if (!profile) return <Alert type="unauthorized" />;

  if (isAthlete(profile.customClaims.role[0]))
    return <Alert type="unauthorized" />;

  // Only delay for authorized users; race init() with the minimum
  const [data] = await Promise.all([
    controller.app.init(),
    sleep(MIN_LOADING_MS), // ensures the server doesn’t reveal *too fast*
  ]);

  return <CoachMainProvider {...data}>{children}</CoachMainProvider>;
}
