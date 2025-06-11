import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { ExerciseProvider } from '@/store/exercises-provider';
import { ComponentController } from '@/controller/component/component.controller';
import { ExerciseController } from '@/controller/exercise/exercise.controller';
import { UserController } from '@/controller/user/user.controller';
import { cookies } from 'next/headers';
import { AttributeController } from '@/controller/attribute/attribute.controller';
import { ChildrenProps } from '@/common/type/props.type';

export default async function Layout({ children }: ChildrenProps) {
  // fetch data
  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_COOKIE_NAME)?.value;
  if (!token) return <div>Unauthorized</div>;

  const profile = await UserController.findMe(token);
  if (!profile) return <div>Unauthorized</div>;

  const [exercises, attributes, components] = await Promise.all([
    ExerciseController.findAll(token),
    AttributeController.findAll(),
    ComponentController.findAll(),
  ]);

  const pageProps = {
    token,
    exercises,
    attributes,
    components,
  };

  return <ExerciseProvider {...pageProps}>{children}</ExerciseProvider>;
}
