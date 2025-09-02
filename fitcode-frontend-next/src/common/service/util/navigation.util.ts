import type { SvgIconComponent } from '@mui/icons-material';
import AccessibilityIcon from '@mui/icons-material/Accessibility';
import AcUnit from '@mui/icons-material/AcUnit';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalFireDepartment from '@mui/icons-material/LocalFireDepartment';
import SportsGymnasticsIcon from '@mui/icons-material/SportsGymnastics';
import SportsMartialArtsIcon from '@mui/icons-material/SportsMartialArts';
import TimerIcon from '@mui/icons-material/Timer';
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

  getComponentIcon(componentName: string): SvgIconComponent | null {
    switch (componentName.toLowerCase()) {
      case 'warmup':
        return LocalFireDepartment;
      case 'cooldown':
        return AcUnit;
      case 'coordination':
        return SportsGymnasticsIcon;
      case 'endurance':
        return DirectionsRunIcon;
      case 'other':
        return AccessibilityIcon;
      case 'rom':
        return SportsMartialArtsIcon;
      case 'speed':
        return TimerIcon;
      case 'strength':
        return FitnessCenterIcon;
      default:
        return null;
    }
  }

  handleErrorRedirectToSignInPage(e: Error) {
    if (e.message === REDIRECT_TO_SIGN_IN) redirect(LINK_SIGN_IN.href);
  }
}
