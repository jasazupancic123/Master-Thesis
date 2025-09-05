import { redirect } from 'next/navigation';

import {
  LINK_SIGN_IN,
  LINKS_SIDEBAR,
} from '@/common/constant/navigation.constant';
import { REDIRECT_TO_SIGN_IN } from '@/common/error/redirect.error';
import type { ILink } from '@/common/type/link.type';
import type { UserRole } from '@/controller/user/enum/user-role.enum';

export class NavigationUtil {
  getSidebarLinksByUserRole(role: UserRole): ILink[] {
    return Object.values(LINKS_SIDEBAR[role]);
  }

  getFilenameFromPath(path: string): string {
    return path.split('/').pop()!;
  }

  handleErrorRedirectToSignInPage(e: Error) {
    if (e.message === REDIRECT_TO_SIGN_IN) redirect(LINK_SIGN_IN.href);
  }
}
