import DashboardInitializer from '@/initializers/dashboard.initializer';

export default function Layout({ children }: React.PropsWithChildren) {
  return <DashboardInitializer>{children}</DashboardInitializer>;
}
