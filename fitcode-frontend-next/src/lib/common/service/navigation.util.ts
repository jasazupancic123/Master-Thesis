import { LINKS_SIDEBAR_GROUP_VIEW } from '@/lib/common/const/nav.const';
import type { ILink } from '@/lib/common/type/link.type';
import type { UserRole } from '@/core/profile/enum/user-role.enum';

export class NavigationUtil {
  getSidebarLinksByUserRole(role: UserRole): ILink[] {
    return Object.values(LINKS_SIDEBAR_GROUP_VIEW[role]);
  }
}
