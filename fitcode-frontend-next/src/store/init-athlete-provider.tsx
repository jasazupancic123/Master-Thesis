import { startOfDay } from 'date-fns';
import { cookies } from 'next/headers';

import { AthleteProvider } from './athlete.provider';
import type { MainProviderProps } from './main.provider';
import { AthleteMainProvider } from './main.provider';
import { SESSION_COOKIE_NAME } from '@/core/const/auth.const';
import { Controller } from '@/core/controller';
import { lib } from '@/lib';
import Alert from '@/ui/alert';

export default async function InitAthleteProvider({
  children,
}: React.PropsWithChildren) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!session) throw new Error('No session');

    const controller = Controller.getInstance();
    const profile = await controller.auth.findMe({ session });
    if (!profile) throw new Error('No profile found');

    if (!lib.firebase.auth.isAthlete(profile.customClaims.role[0]))
      throw new Error('Not an athlete');

    // For now, we just take the first institution
    const institutions = await controller.institution.findAll({ session });
    const institutionId = institutions[0]?.id;
    if (!institutionId) throw new Error('No institution found');

    const [main, institution, reports, trainings] = await Promise.all([
      controller.app.init({ session }),
      controller.institution.init(institutionId, { session }),
      controller.training.findReports(institutionId!, { session }),
      controller.training.findAll(
        {
          institutionId,
          from: startOfDay(new Date()),
          populate: true,
          limit: 100,
        },
        { session }
      ),
    ]);

    console.log('reports', reports);

    const data: MainProviderProps = {
      profile: main.profile,
      institutions,
      institution,
      activeTraining: main.activeTraining,
      exerciseAiPrescriptions: main.exerciseAiPrescriptions,
      globalExercisesRevision: main.globalExercisesRevision,
      trainings: trainings.sort(
        (a, b) => new Date(a.from).getTime() - new Date(b.from).getTime()
      ),
      reports: reports.sort(
        (a, b) => new Date(b.from).getTime() - new Date(a.from).getTime()
      ),
    };

    return (
      <AthleteMainProvider key={profile.uid} {...data}>
        <AthleteProvider trainings={trainings} reports={reports}>
          {children}
        </AthleteProvider>
      </AthleteMainProvider>
    );
  } catch (e) {
    console.error('[AthleteProvider] error', e);
    return <Alert type="error" errorMessage={(e as Error).message} />;
  }
}
