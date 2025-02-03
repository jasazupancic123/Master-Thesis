'use client';

import { useAuth } from '@/context/auth-provider';
import { UserRole } from '@/user/enum/user-role.enum';
import GroupsSidebar from '@/common/components/groups-sidebar';
import { GroupSidebarProvider } from '@/context/groups-sidebar-provider';

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = useAuth();

  return (
    <GroupSidebarProvider>
      <div style={{ display: 'flex' }}>
        {role.includes(UserRole.TRAINER) && <GroupsSidebar />}
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </GroupSidebarProvider>
  );
}
