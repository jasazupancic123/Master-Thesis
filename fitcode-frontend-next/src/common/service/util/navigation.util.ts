import { ILink } from '@/common/type/link.type';
import { LINKS_SIDEBAR } from '@/common/constant/navigation.constant';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import { SvgIconComponent } from '@mui/icons-material';
import SportsGymnasticsIcon from '@mui/icons-material/SportsGymnastics';
import TimerIcon from '@mui/icons-material/Timer';
import SportsMartialArtsIcon from '@mui/icons-material/SportsMartialArts';
import AccessibilityIcon from '@mui/icons-material/Accessibility';

export class NavigationUtil {
  getSidebarLinksByUserRole(role: UserRole): ILink[] {
    return Object.values(LINKS_SIDEBAR[role]);
  }

  getFilenameFromPath(path: string): string {
    return path.split('/').pop()!;
  }

  getComponentIcon(componentName: string): SvgIconComponent {
    switch (componentName.toLowerCase()) {
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
        return QuestionMarkIcon;
    }
  }
}
