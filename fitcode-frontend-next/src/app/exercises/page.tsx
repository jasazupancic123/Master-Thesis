import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { ExerciseProvider } from '@/context/exercises-provider';
import { ComponentController } from '@/controller/component/component.controller';
import { ExerciseController } from '@/controller/exercise/exercise.controller';
import { UserController } from '@/controller/user/user.controller';
import { cookies } from 'next/headers';
import ExercisesPage from './exercises-page';

export default async function Page() {
  // fetch data
  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_COOKIE_NAME)?.value;
  if (!token) return <div>Unauthorized</div>;

  const profile = await UserController.findMe(token);
  if (!profile) return <div>Unauthorized</div>;

  const [exercises, attributes, components] = await Promise.all([
    ExerciseController.findAll(token),
    ExerciseController.findAttributes(),
    ComponentController.findAll(),
  ]);

  const pageProps = {
    token,
    exercises,
    attributes,
    components,
  };

  return (
    <ExerciseProvider {...pageProps}>
      <ExercisesPage />
    </ExerciseProvider>
  );
}
