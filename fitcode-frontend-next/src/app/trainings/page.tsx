import { GroupController } from '@/controller/group/group.controller';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { UserController } from '@/controller/user/user.controller';
import { cookies } from 'next/headers';
import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { notFound } from 'next/navigation';
import TrainingPage from './training-page';
import { TrainingController } from '@/controller/training/training.controller';
import { ExerciseService } from '@/controller/exercise/exercise.service';
import { ExerciseController } from '@/controller/exercise/exercise.controller';
import { TrainingService } from '@/controller/training/training.service';
import { ComponentController } from '@/controller/component/component.controller';

export default async function Page() {
  try {
    // fetch data
    const cookieStore = await cookies();
    const token = cookieStore.get(FIREBASE_COOKIE_NAME)?.value;
    if (!token) return <div>Unauthorized</div>;

    const profile = await UserController.findMe(token);
    if (!profile) return <div>Unauthorized</div>;

    const role = profile.customClaims.role[0];
    const [trainings, exercises, components] = await Promise.all([
      TrainingController.findAll(token),
      ExerciseController.findAll(token),
      ComponentController.findAll(),
    ]);

    if ([UserRole.ADMIN, UserRole.MANAGER].includes(role)) return notFound();

    const mappedTrainings = trainings.map((t) =>
      TrainingService.mapComponents(
        TrainingService.mapExercises(t, exercises),
        components
      )
    );

    return (
      <TrainingPage
        token={token}
        profile={profile}
        trainings={mappedTrainings}
      />
    );
  } catch (e: any) {
    <>Error: {e.message}</>;
  }
}
