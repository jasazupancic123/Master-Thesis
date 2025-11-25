import { cookies } from 'next/headers';

import { SESSION_COOKIE_NAME } from '@/core/const/auth.const';
import { Controller } from '@/core/controller';
import { lib } from '@/lib';
import type { MainProviderProps } from '@/store/main.provider';
import { CoachMainProvider } from '@/store/main.provider';
import Alert from '@/ui/alert';

export default async function InitTrainerProvider({
  children,
}: React.PropsWithChildren) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!session) throw new Error('No session');

    const controller = Controller.getInstance();
    const profile = await controller.auth.findMe({ session });
    if (!profile) throw new Error('No profile found');

    if (lib.firebase.auth.isAthlete(profile.customClaims.role[0]))
      throw new Error('Not a trainer or manager');

    // For now, we just take the first institution
    const institutions = await controller.institution.findAll({ session });
    const institutionId = institutions[0]?.id;
    if (!institutionId) throw new Error('No institution found');

    const [main, institution] = await Promise.all([
      controller.app.init({ session }),
      controller.institution.init(institutionId, { session }),
    ]);

    const data: MainProviderProps = {
      profile: main.profile,
      institutions,
      institution,
      activeTraining: null,
      exerciseAiPrescriptions: main.exerciseAiPrescriptions,
      globalExercisesRevision: main.globalExercisesRevision,
      trainings: [],
      reports: [],
    };

    return (
      <CoachMainProvider key={profile.uid} {...data}>
        {children}
      </CoachMainProvider>
    );
  } catch (e) {
    console.error('[TrainerProvider] error', e);
    return <Alert type="error" errorMessage={(e as Error).message} />;
  }
}
