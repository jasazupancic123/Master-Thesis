'use client';

import { useAuth } from '@/context/auth-provider';
import { GroupSidebarProvider } from '@/context/groups-sidebar-provider';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import GroupsSidebar from './groups-sidebar';

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
