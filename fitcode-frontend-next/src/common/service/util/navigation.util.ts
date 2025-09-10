import { LINKS_SIDEBAR } from '@/common/constant/navigation.constant';
import type { ILink } from '@/common/type/link.type';
import type { UserRole } from '@/controller/user/enum/user-role.enum';

export class NavigationUtil {
  getSidebarLinksByUserRole(role: UserRole): ILink[] {
    return Object.values(LINKS_SIDEBAR[role]);
  }
}
