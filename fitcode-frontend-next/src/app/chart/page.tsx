import { ChildrenProps } from '@/common/type/props.type';
import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { UserController } from '@/controller/user/user.controller';
import { cookies } from 'next/headers';
import ChartPage from './chart-page';
import { ComponentController } from '@/controller/component/component.controller';
import { ExerciseController } from '@/controller/exercise/exercise.controller';

export default async function Page({ children }: ChildrenProps) {
  // fetch data
  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_COOKIE_NAME)?.value;
  if (!token) return <div>Unauthorized</div>;

  const components = await ComponentController.findAll();
  if (!components) return <div>Unauthorized</div>;

  const exercises = await ExerciseController.findAll(token);
  if (!exercises) return <div>Unauthorized</div>;

  const profile = await UserController.findMe(token);
  if (!profile) return <div>Unauthorized</div>;

  return (
    <ChartPage user={profile} components={components} exercises={exercises} />
  );
}
