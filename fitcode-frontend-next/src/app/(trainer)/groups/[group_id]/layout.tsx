import { getTokenAndCheckUserAccess } from '@/common/helper/ssr';
import type { ChildrenProps } from '@/common/type/props.type';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import GroupInitializer from '@/initializers/group.initializer';

interface GroupLayoutProps extends ChildrenProps {
  params: Promise<{ group_id: string }>;
}

export default async function Layout(props: GroupLayoutProps) {
  await getTokenAndCheckUserAccess([UserRole.TRAINER, UserRole.MANAGER]);

  const { children, params } = props;
  return <GroupInitializer params={params}>{children}</GroupInitializer>;
}
