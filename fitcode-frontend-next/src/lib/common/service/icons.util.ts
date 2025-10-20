import type { SvgIconComponent } from '@mui/icons-material';
import {
  Accessibility,
  AcUnit,
  LocalFireDepartment,
} from '@mui/icons-material';
import CompetitionIcon from '@mui/icons-material/EmojiEvents';
import type { Theme } from '@mui/material';

import CoordinationIcon from '@/assets/icons/Coordination.svg';
import EnduranceIcon from '@/assets/icons/Endurance.svg';
import RomIcon from '@/assets/icons/Rom.svg';
import SpeedIcon from '@/assets/icons/Speed.svg';
import StrengthIcon from '@/assets/icons/Strength.svg';
import type { SvgC } from '@/components/muscle-map-with-tooltip/muscle-map-with-tooltip';

export class ComponentUtil {
  getIcon(componentName: string): SvgIconComponent | SvgC | null {
    switch (componentName.toLowerCase()) {
      case 'warmup':
        return LocalFireDepartment;
      case 'cooldown':
        return AcUnit;
      case 'coordination':
        return CoordinationIcon as SvgC;
      case 'endurance':
        return EnduranceIcon as SvgC;
      case 'other':
        return Accessibility;
      case 'rom':
        return RomIcon as SvgC;
      case 'speed':
        return SpeedIcon as SvgC;
      case 'strength':
        return StrengthIcon as SvgC;
      case 'competition':
        return CompetitionIcon;
      default:
        return null;
    }
  }

  getBorderGradient(theme: Theme): string {
    const fromColor = theme.palette.primary.main;
    const toColor = theme.palette.background.light;
    const direction = 'to bottom';
    return `linear-gradient(${direction}, ${fromColor}, ${toColor})`;
  }
}
