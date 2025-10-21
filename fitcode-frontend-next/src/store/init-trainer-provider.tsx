import { cookies } from 'next/headers';

import { SESSION_COOKIE_NAME } from '@/common/constant/auth.constant';
import { LOADING_ANIMATION_MIN_DURATION_MS } from '@/common/constant/loading.constant';
import { isAthlete } from '@/common/firebase/firebase-auth.util';
import type { ChildrenProps } from '@/common/type/props.type';
import { Controller } from '@/controller/controller';
import { CoachMainProvider } from '@/store/main.provider';
import Alert from '@/util/alert/alert';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default async function InitTrainerProvider({ children }: ChildrenProps) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!session) throw new Error('No session');

    const controller = Controller.getInstance();
    const profile = await controller.auth.findMe({ session });
    if (!profile) throw new Error('No profile found');
    console.log('[TrainerProvider] profile', profile);

    if (isAthlete(profile.customClaims.role[0]))
      throw new Error('Not a trainer or manager');

    const [data] = await Promise.all([
      controller.app.init({ session }),
      sleep(LOADING_ANIMATION_MIN_DURATION_MS), // ensures the server doesn’t reveal *too fast*
    ]);

    return (
      <CoachMainProvider key={profile.uid} {...data}>
        {children}
      </CoachMainProvider>
    );
  } catch (e) {
    console.error('[TrainerProvider] error', e);
    return <Alert type="unauthorized" />;
  }
}
