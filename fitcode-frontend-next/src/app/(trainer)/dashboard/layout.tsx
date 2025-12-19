import { DashboardUserActionsProvider } from '@/components/dashboard/context/user-actions.context';
import DashboardLayout from '@/sites/dashboard.layout';
import { DashboardProvider } from '@/store/dashboard.provider';
import { DashboardGroupActionsProvider } from '@/store/dashboard-group-actions.provider';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <DashboardProvider>
      <DashboardGroupActionsProvider>
        <DashboardUserActionsProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </DashboardUserActionsProvider>
      </DashboardGroupActionsProvider>
    </DashboardProvider>
  );
}
