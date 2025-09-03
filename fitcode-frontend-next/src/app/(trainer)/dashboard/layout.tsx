// dashboard/layout.tsx
import type { ChildrenProps } from '@/common/type/props.type';
import DashboardInitializer from '@/initializers/dashboard.initializer';
import { AuthGuard } from '@/store/auth-provider';

export default function Layout({ children }: ChildrenProps) {
  return (
    <AuthGuard>
      <DashboardInitializer>{children}</DashboardInitializer>
    </AuthGuard>
  );
}
