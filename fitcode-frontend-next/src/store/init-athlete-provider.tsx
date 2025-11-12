import { startOfDay } from 'date-fns';
import { cookies } from 'next/headers';

import { AthleteProvider } from './athlete.provider';
import { AthleteMainProvider } from './main.provider';
import { SESSION_COOKIE_NAME } from '@/core/const/auth.const';
import { Controller } from '@/core/controller';
import { TrainingService } from '@/core/training/training.service';
import { lib } from '@/lib';
import { LOADING_ANIMATION_MIN_DURATION_MS } from '@/lib/common/const/animation.const';
import Alert from '@/ui/alert';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

    const [data] = await Promise.all([
      controller.app.init({ session }),
      sleep(LOADING_ANIMATION_MIN_DURATION_MS),
    ]);

    const institutionId = data.institutions?.[0]?.id;

    let [trainings, reports] = await Promise.all([
      controller.training.findAll(
        {
          institutionId,
          from: startOfDay(new Date()),
          populate: true,
          limit: 100,
        },
        { session }
      ),
      controller.training.findReports(institutionId!, { session }),
    ]);

    trainings = trainings
      .map((t) => TrainingService.mapData(t, data))
      .sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime());

    reports = reports
      .map((t) => TrainingService.mapReport(t, data))
      .sort((a, b) => new Date(b.from).getTime() - new Date(a.from).getTime());

    return (
      <AthleteMainProvider key={profile.uid} {...data}>
        <AthleteProvider trainings={trainings} reports={reports}>
          {children}
        </AthleteProvider>
      </AthleteMainProvider>
    );
  } catch (e) {
    console.error('[AthleteProvider] error', e);
    return <Alert type="unauthorized" />;
  }
}
