import { DashboardUserEditProvider } from '@/components/dashboard/context/user-edit.context';
import DashboardLayout from '@/sites/dashboard.layout';
import { DashboardProvider } from '@/store/dashboard.provider';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <DashboardProvider>
      <DashboardUserEditProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </DashboardUserEditProvider>
    </DashboardProvider>
  );
}
