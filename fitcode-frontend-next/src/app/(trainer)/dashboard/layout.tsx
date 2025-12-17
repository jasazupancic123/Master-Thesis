import { DashboardUserEditProvider } from '@/components/dashboard/context/user-edit.context';
import DashboardLayout from '@/sites/dashboard.layout';
import { DashboardGroupActionsProvider } from '@/store/dashboard-group-actions.provider';
import { DashboardProvider } from '@/store/dashboard.provider';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <DashboardProvider>
      <DashboardGroupActionsProvider>
        <DashboardUserEditProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </DashboardUserEditProvider>
      </DashboardGroupActionsProvider>
    </DashboardProvider>
  );
}
