'use client';

import { DashboardUserEditProvider } from '@/components/dashboard/context/user-edit.context';
import DashboardLayout from '@/sites/dashboard.layout';
import { DashboardProvider } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

type WithInstitutionProps = {
  institutionId: string;
};

function withInstitution<T>(
  Component: React.ComponentType<T & WithInstitutionProps>
) {
  return function WrappedComponent(props: T) {
    const { institutions } = useMain();
    if (institutions.length === 0) return null;
    return <Component {...props} institutionId={institutions[0]?.id} />;
  };
}

export default withInstitution(DashboardInitializer);

function DashboardInitializer({
  children,
  institutionId,
}: React.PropsWithChildren & WithInstitutionProps) {
  return (
    <DashboardProvider institutionId={institutionId}>
      <DashboardUserEditProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </DashboardUserEditProvider>
    </DashboardProvider>
  );
}
