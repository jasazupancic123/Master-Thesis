import { theme } from '@/app/style';
import { alpha } from '@mui/material';

export const LINEAR_GRADIENT_BG = `linear-gradient(135deg, ${theme.palette.background.dark} 0%, ${alpha(theme.palette.background.light, 0.5)} 100%, ${theme.palette.background.light} 100%)`;
