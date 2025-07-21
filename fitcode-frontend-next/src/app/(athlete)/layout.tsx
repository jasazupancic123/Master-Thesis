import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import {
  isAdmin,
  isAthlete,
  isManager,
} from '@/common/service/util/firebase-auth.util';
import { ChildrenProps } from '@/common/type/props.type';
import Alert from '@/components/alert/alert';
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
  if (!token) return <Alert type="unauthorized" />;

  const profile = await UserController.findMe(token);
  if (!profile) return <Alert type="unauthorized" />;

  const roles = profile.customClaims.role;

  if (!isAthlete(roles)) return <Alert type="unauthorized" />;

  if (isAdmin(roles) || isManager(roles)) return notFound();

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
