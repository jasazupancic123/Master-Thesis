import type { ChildrenProps } from '@/common/type/props.type';
import GroupInitializer from '@/initializers/group.initializer';

export default async function Layout(props: ChildrenProps) {
  const { children } = props;
  return <GroupInitializer>{children}</GroupInitializer>;
}
