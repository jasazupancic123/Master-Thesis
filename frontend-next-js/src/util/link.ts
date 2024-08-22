import { UserRole } from '@/enum/user-role.enum';
import { LINKS_SIDEBAR } from '@/constant/link';
import { ILink } from '@/type/link.type';

export function getSidebarLinksByUserRole(role: UserRole): ILink[] {
  return Object.values(LINKS_SIDEBAR[role]);
}

export function getFilenameFromPath(path: string): string {
  return path.split('/').pop()!;
}