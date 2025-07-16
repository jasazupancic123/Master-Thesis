// dashboard/layout.tsx
import { ChildrenProps } from '@/common/type/props.type';
import DashboardInitializer from '@/initializers/dashboard.initializer';

export default function Layout({ children }: ChildrenProps) {
  return <DashboardInitializer>{children}</DashboardInitializer>;
}
