import { UserRole } from '@/user/enum/user-role.enum';
import { ILink } from '@/common/type/link.type';
import { LINKS_SIDEBAR } from '@/common/constant/navigation.constant';

export class NavigationUtil {
  getSidebarLinksByUserRole(role: UserRole): ILink[] {
    return Object.values(LINKS_SIDEBAR[role]);
  }

  getFilenameFromPath(path: string): string {
    return path.split('/').pop()!;
  }
}