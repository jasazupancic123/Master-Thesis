import {
  Accessibility,
  AcUnit,
  LocalFireDepartment,
} from '@mui/icons-material';
import CompetitionIcon from '@mui/icons-material/EmojiEvents';
import type { SvgIconProps, Theme } from '@mui/material';
import type { ElementType } from 'react';

import CoordinationIcon from '@/assets/icons/Coordination.svg';
import EnduranceIcon from '@/assets/icons/Endurance.svg';
import RomIcon from '@/assets/icons/Rom.svg';
import SpeedIcon from '@/assets/icons/Speed.svg';
import StrengthIcon from '@/assets/icons/Strength.svg';

export class ComponentUtil {
  getIcon(componentName: string): ElementType<SvgIconProps> | null {
    switch (componentName.toLowerCase()) {
      case 'warmup':
        return LocalFireDepartment;
      case 'cooldown':
        return AcUnit;
      case 'coordination':
        return CoordinationIcon;
      case 'endurance':
        return EnduranceIcon;
      case 'other':
        return Accessibility;
      case 'rom':
        return RomIcon;
      case 'speed':
        return SpeedIcon;
      case 'strength':
        return StrengthIcon;
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
