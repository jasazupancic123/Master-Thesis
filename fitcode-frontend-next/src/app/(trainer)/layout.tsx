import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { ChildrenProps } from '@/common/type/props.type';
import Loading from '@/components/loading/loading';
import { AttributeController } from '@/controller/attribute/attribute.controller';
import { ComponentController } from '@/controller/component/component.controller';
import { ExerciseController } from '@/controller/exercise/exercise.controller';
import { MethodController } from '@/controller/method/method.controller';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { UserController } from '@/controller/user/user.controller';
import { MainProvider, MainProviderProps } from '@/store/main-provider';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

export default async function Layout({ children }: ChildrenProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_COOKIE_NAME)?.value;
  if (!token) return <Loading text="Unauthorized" />;

  const profile = await UserController.findMe(token);
  if (!profile) return <Loading text="Unauthorized" />;

  const roles = profile.customClaims.role;

  if (
    !roles.includes(UserRole.TRAINER) &&
    !roles.includes(UserRole.MANAGER) &&
    !roles.includes(UserRole.ADMIN)
  )
    return <Loading text="Unauthorized" />;

  const [users, exercises, attributes, components, methods] = await Promise.all(
    [
      UserController.findAll(token),
      ExerciseController.findAllGlobal(token),
      AttributeController.findAll(),
      ComponentController.findAll(),
      MethodController.findAll(token),
    ]
  );

  const context: MainProviderProps = {
    profile,
    users,
    exercises,
    attributes,
    components,
    methods,
  };

  return <MainProvider {...context}>{children}</MainProvider>;
}
