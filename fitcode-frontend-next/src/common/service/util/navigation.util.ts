import { LINKS_SIDEBAR_GROUP_VIEW } from '@/common/constant/navigation.constant';
import type { ILink } from '@/common/type/link.type';
import type { UserRole } from '@/controller/profile/enum/user-role.enum';

export class NavigationUtil {
  getSidebarLinksByUserRole(role: UserRole): ILink[] {
    return Object.values(LINKS_SIDEBAR_GROUP_VIEW[role]);
  }
}
