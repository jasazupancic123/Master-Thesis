import GroupInitializer from '@/initializers/group.initializer';

export default async function Layout(props: React.PropsWithChildren) {
  const { children } = props;
  return <GroupInitializer>{children}</GroupInitializer>;
}
