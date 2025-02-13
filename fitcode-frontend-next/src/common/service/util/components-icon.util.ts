import React, { JSX } from 'react';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import { SvgIconComponent } from '@mui/icons-material';
import SportsGymnasticsIcon from '@mui/icons-material/SportsGymnastics';
import TimerIcon from '@mui/icons-material/Timer';
import SportsMartialArtsIcon from '@mui/icons-material/SportsMartialArts';
import AccessibilityIcon from '@mui/icons-material/Accessibility';

export const getComponentIcon = (componentName: string): SvgIconComponent  => {
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
  };
  
