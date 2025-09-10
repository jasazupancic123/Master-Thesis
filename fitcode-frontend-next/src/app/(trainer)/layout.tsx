'use client';

import type { ChildrenProps } from '@/common/type/props.type';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { withAuth } from '@/store/auth.provider';
import MainProvider from '@/store/main.provider';

export default withAuth(Layout, [
  UserRole.TRAINER,
  UserRole.MANAGER,
  UserRole.ADMIN,
]);

function Layout({ children }: ChildrenProps) {
  return <MainProvider>{children}</MainProvider>;
}
