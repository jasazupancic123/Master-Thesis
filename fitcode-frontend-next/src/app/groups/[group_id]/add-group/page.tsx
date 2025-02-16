import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { GroupController } from '@/controller/group/group.controller';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { UserController } from '@/controller/user/user.controller';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { GroupIdPageParams, GroupIdPageProps } from '../props';
import AddGroupPage from './add-group-page';

export default async function Page(props: GroupIdPageParams) {
  // fetch data
  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_COOKIE_NAME)?.value;
  if (!token) return <div>Unauthorized</div>;

  const profile = await UserController.findMe(token);
  if (!profile) return <div>Unauthorized</div>;

  const role = profile.customClaims.role[0];
  if (![UserRole.TRAINER, UserRole.MANAGER].includes(role))
    return <div>Unauthorized</div>;

  const groupId = (await props.params).group_id; // https://nextjs.org/docs/messages/sync-dynamic-apis
  const group = await GroupController.findById(token, groupId);
  if (!group) return notFound();

  const [groups, users] = await Promise.all([
    GroupController.findAll(token),
    UserController.findAll(token),
  ]);

  const addGroupPage: GroupIdPageProps = {
    token,
    group,
    groups,
    users,
    exercises: [],
    attributes: [],
    components: [],
    trainings: [],
  };

  return <AddGroupPage {...addGroupPage} />;
}
