import { ILink } from '@/common/type/link.type';
import { LINKS_SIDEBAR } from '@/common/constant/navigation.constant';
import { UserRole } from '@/controller/user/enum/user-role.enum';

export class NavigationUtil {
  getSidebarLinksByUserRole(role: UserRole): ILink[] {
    return Object.values(LINKS_SIDEBAR[role]);
  }

  getFilenameFromPath(path: string): string {
    return path.split('/').pop()!;
  }
}
