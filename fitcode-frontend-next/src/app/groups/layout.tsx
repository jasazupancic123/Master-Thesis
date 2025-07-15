import { ChildrenProps } from '@/common/type/props.type';
import GroupsInitializer from '@/initializers/groups.initializer';

export default function Layout({ children }: ChildrenProps) {
  return <GroupsInitializer>{children}</GroupsInitializer>;
}
