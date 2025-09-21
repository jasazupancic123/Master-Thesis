import { Theme } from '@mui/material';

export const getBorderGradient = (theme: Theme): string => {
  const fromColor = theme.palette.primary.main;
  const toColor = theme.palette.background.light;

  const dirrection = 'to bottom';
  return `linear-gradient(${dirrection}, ${fromColor}, ${toColor})`;
};
