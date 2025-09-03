import { getTokenAndCheckUserAccess } from '@/common/helper/ssr';
import type { ChildrenProps } from '@/common/type/props.type';
import { AttributeController } from '@/controller/attribute/attribute.controller';
import { ComponentController } from '@/controller/component/component.controller';
import { ExerciseController } from '@/controller/exercise/exercise.controller';
import { InstitutionController } from '@/controller/institution/institution.controller';
import { MethodController } from '@/controller/method/method.controller';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { UserController } from '@/controller/user/user.controller';
import type { MainProviderProps } from '@/store/main-provider';
import { MainProvider } from '@/store/main-provider';

export default async function Layout({ children }: ChildrenProps) {
  const token = await getTokenAndCheckUserAccess([
    UserRole.TRAINER,
    UserRole.MANAGER,
  ]);

  const [users, exercises, attributes, components, methods, institutions] =
    await Promise.all([
      UserController.findAll(token),
      ExerciseController.findAllGlobal(token),
      AttributeController.findAll(),
      ComponentController.findAll(),
      MethodController.findAll(token),
      InstitutionController.findAll(token),
    ]);

  const institutionId = institutions?.[0]?.id || null; // currently, we only support 1 institution
  if (institutionId) {
    const institutionalExercises =
      await ExerciseController.findAllByInstitution(token, institutionId);

    exercises.push(...institutionalExercises);
  }

  const context: MainProviderProps = {
    users,
    exercises,
    attributes,
    components,
    methods,
    institutions,
  };

  return <MainProvider {...context}>{children}</MainProvider>;
}
