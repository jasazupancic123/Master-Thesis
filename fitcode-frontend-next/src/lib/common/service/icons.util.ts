import type { SvgIconComponent } from '@mui/icons-material';
import {
  Accessibility,
  AcUnit,
  BatteryFull,
  LocalFireDepartment,
} from '@mui/icons-material';
import type { Theme } from '@mui/material';

export class ComponentUtil {
  getIcon(componentName: string): SvgIconComponent | null {
    switch (componentName.toLowerCase()) {
      case 'warmup':
        return LocalFireDepartment;
      case 'cooldown':
        return AcUnit;
      case 'coordination':
        return BatteryFull;
      case 'endurance':
        return BatteryFull;
      case 'other':
        return Accessibility;
      case 'rom':
        return BatteryFull;
      case 'speed':
        return BatteryFull;
      case 'strength':
        return BatteryFull;
      case 'competition':
        return BatteryFull;
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
