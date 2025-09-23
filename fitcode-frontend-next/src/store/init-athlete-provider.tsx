import { isAthlete } from '@/common/firebase/firebase-auth.util';
import { ChildrenProps } from '@/common/type/props.type';
import { getAuthIdTokenFromCookies } from '@/common/util/auth.util';
import Alert from '@/components/alert/alert';
import { Controller } from '@/controller/controller';
import { TrainingService } from '@/controller/training/training.service';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import { AthleteProvider } from './athlete.provider';
import { AthleteMainProvider } from './main.provider';

const MIN_LOADING_MS = 3000;

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
    sleep(MIN_LOADING_MS),
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
