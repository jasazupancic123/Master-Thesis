import { cookies } from 'next/headers';

import { SESSION_COOKIE_NAME } from '@/common/constant/auth.constant';
import { LOADING_ANIMATION_MIN_DURATION_MS } from '@/common/constant/loading.constant';
import { isAthlete } from '@/common/firebase/firebase-auth.util';
import type { ChildrenProps } from '@/common/type/props.type';
import Alert from '@/components/alert/alert';
import { Controller } from '@/controller/controller';
import { CoachMainProvider } from '@/store/main.provider';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default async function InitTrainerProvider({ children }: ChildrenProps) {
  try {
    const cookieStore = await cookies();
    console.log('all cookies:', cookieStore.getAll());
    const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!session) return <Alert type="unauthorized" />;

    const controller = Controller.getInstance();
    const profile = await controller.auth.findMe({ session });
    console.log('profile:', profile);
    if (!profile) return <Alert type="unauthorized" />;

    if (isAthlete(profile.customClaims.role[0]))
      return <Alert type="unauthorized" />;

    const [data] = await Promise.all([
      controller.app.init({ session }),
      sleep(LOADING_ANIMATION_MIN_DURATION_MS), // ensures the server doesn’t reveal *too fast*
    ]);

    return <CoachMainProvider {...data}>{children}</CoachMainProvider>;
  } catch (e) {
    console.log('[InitTrainerProvider] error', e);
    return <Alert type="unauthorized" />;
  }
}
