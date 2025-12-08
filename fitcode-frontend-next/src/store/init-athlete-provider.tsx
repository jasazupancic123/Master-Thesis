import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AthleteProvider } from './athlete.provider';
import type { MainProviderProps } from './main.provider';
import { AthleteMainProvider } from './main.provider';
import { SESSION_COOKIE_NAME } from '@/core/const/auth.const';
import { Controller } from '@/core/controller';
import { lib } from '@/lib';
import { LINK_SIGN_IN } from '@/lib/common/const/nav.const';
import type { FetchOptions } from '@/lib/common/type/api.type';
import Alert from '@/ui/alert';

export default async function InitAthleteProvider({
  children,
}: React.PropsWithChildren) {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!session) {
    console.log('No session found, redirecting to sign-in page');
    redirect(LINK_SIGN_IN.href);
  }

  try {
    const opts: FetchOptions = { session };

    const controller = Controller.getInstance();
    const { profile, institutions, activeTraining, exerciseAiPrescriptions } =
      await controller.app.init({ session });

    if (!lib.firebase.auth.isAthlete(profile.role))
      throw new Error('Not an athlete');

    // For now, we just take the first institution
    const institutionId = institutions[0]?.id;
    if (!institutionId) throw new Error('No institution found');

    const institution = await controller.institution.init(institutionId, opts);
    const data: MainProviderProps = {
      profile,
      institutions,
      institution,
      activeTraining,
      exerciseAiPrescriptions,
    };

    return (
      <AthleteMainProvider key={profile.uid} {...data}>
        <AthleteProvider>{children}</AthleteProvider>
      </AthleteMainProvider>
    );
  } catch (e) {
    console.error('[AthleteProvider] error', e);
    return <Alert type="error" errorMessage={(e as Error).message} />;
  }
}
