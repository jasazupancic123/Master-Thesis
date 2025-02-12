import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { UserController } from '@/controller/user/user.controller';
import { cookies } from 'next/headers';
import AddGroupPage from './add-group-page';
import { GroupController } from '@/controller/group/group.controller';
import { GroupIdPageParams, GroupIdPageProps } from '../type';
import { notFound } from 'next/navigation';
import { ComponentController } from '@/controller/component/component.controller';
import { ExerciseController } from '@/controller/exercise/exercise.controller';

export default async function Page({ params }: GroupIdPageParams) {
  // fetch data
  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_COOKIE_NAME)?.value;
  if (!token) return <div>Unauthorized</div>;

  const profile = await UserController.findMe(token);
  if (!profile) return <div>Unauthorized</div>;

  const role = profile.customClaims.role[0];
  if (![UserRole.TRAINER, UserRole.MANAGER].includes(role))
    return <div>Unauthorized</div>;

  const groupId = (await params).group_id; // https://nextjs.org/docs/messages/sync-dynamic-apis
  const group = await GroupController.findById(token, groupId);
  if (!group) return notFound();

  const [groups] = await Promise.all([GroupController.findAll(token)]);

  const props: GroupIdPageProps = {
    token,
    group,
    groups,
    users: [],
    exercises: [],
    attributes: [],
    components: [],
    trainings: [],
  };

  return <AddGroupPage {...props} />;
}
