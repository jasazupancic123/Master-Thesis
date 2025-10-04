import { endOfDay, startOfDay, subDays } from 'date-fns';

import { AthleteProvider } from './athlete.provider';
import { AthleteMainProvider } from './main.provider';
import { LOADING_ANIMATION_MIN_DURATION_MS } from '@/common/constant/loading.constant';
import { isAthlete } from '@/common/firebase/firebase-auth.util';
import type { ChildrenProps } from '@/common/type/props.type';
import { getAuthIdTokenFromCookies } from '@/common/util/auth.util';
import Alert from '@/components/alert/alert';
import { Controller } from '@/controller/controller';
import { TrainingService } from '@/controller/training/training.service';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default async function InitAthleteProvider({ children }: ChildrenProps) {
  const token = await getAuthIdTokenFromCookies();
  if (!token) return <Alert type="unauthorized" />;

  const controller = Controller.getInstance(token);
  const profile = await controller.auth.findMe();
  if (!profile) return <Alert type="unauthorized" />;

  if (!isAthlete(profile.customClaims.role[0]))
    return <Alert type="unauthorized" />;

  const [data] = await Promise.all([
    controller.app.init(),
    sleep(LOADING_ANIMATION_MIN_DURATION_MS),
  ]);

  let [trainings, reports] = await Promise.all([
    controller.training.findAll({
      from: startOfDay(new Date()),
      populate: true,
      limit: 100,
    }),
    controller.training.findReports({
      from: subDays(new Date(), 30),
      to: endOfDay(new Date()),
    }),
  ]);

  trainings = trainings
    .map((t) => TrainingService.mapData(t, data))
    .sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime());

  reports = reports
    .map((t) => TrainingService.mapReport(t, data))
    .sort((a, b) => new Date(b.from).getTime() - new Date(a.from).getTime());

  return (
    <AthleteMainProvider {...data}>
      <AthleteProvider trainings={trainings} reports={reports}>
        {children}
      </AthleteProvider>
    </AthleteMainProvider>
  );
}
