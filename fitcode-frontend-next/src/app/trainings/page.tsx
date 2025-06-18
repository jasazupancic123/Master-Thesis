import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { ComponentController } from '@/controller/component/component.controller';
import { ExerciseController } from '@/controller/exercise/exercise.controller';
import { TrainingController } from '@/controller/training/training.controller';
import { TrainingService } from '@/controller/training/training.service';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { UserController } from '@/controller/user/user.controller';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import TrainingPage from '../../sites/training.page';
import { MethodController } from '@/controller/method/method.controller';
import { Training } from '@/controller/training/type/training.type';

export default async function Page() {
  // fetch data
  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_COOKIE_NAME)?.value;
  if (!token) return <div>Unauthorized</div>;

  const profile = await UserController.findMe(token);
  if (!profile) return <div>Unauthorized</div>;

  const role = profile.customClaims.role[0];
  const [trainings, exercises, components, methods] = await Promise.all([
    TrainingController.findAll(token),
    ExerciseController.findAll(token),
    ComponentController.findAll(),
    MethodController.findAll(token),
  ]);

  if ([UserRole.ADMIN, UserRole.MANAGER].includes(role)) return notFound();

  const mappedTrainings = (trainings as Training[]).map((t) => {
    t = TrainingService.mapComponentsExercisesMethods(
      t,
      components,
      exercises,
      methods
    );
    return t;
  });

  return (
    <TrainingPage
      userId={profile.uid}
      token={token}
      profile={profile}
      trainings={mappedTrainings}
    />
  );
}
