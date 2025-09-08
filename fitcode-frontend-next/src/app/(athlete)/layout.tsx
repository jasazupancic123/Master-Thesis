'use client';

import type { ChildrenProps } from '@/common/type/props.type';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { AthleteProvider } from '@/store/athlete-provider';
import { withAuth } from '@/store/auth-provider';
import MainProvider from '@/store/main-provider';

export default withAuth(Layout, [UserRole.ATHLETE]);

function Layout({ children }: ChildrenProps) {
  return (
    <MainProvider>
      <AthleteProvider>{children}</AthleteProvider>
    </MainProvider>
  );
}
