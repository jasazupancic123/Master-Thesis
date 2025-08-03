import type { ChildrenProps } from '@/common/type/props.type';
import GroupInitializer from '@/initializers/group.initializer';

interface GroupLayoutProps extends ChildrenProps {
  params: Promise<{
    group_id: string;
  }>;
}

export default function Layout(props: GroupLayoutProps) {
  const { children, params } = props;
  return <GroupInitializer params={params}>{children}</GroupInitializer>;
}
