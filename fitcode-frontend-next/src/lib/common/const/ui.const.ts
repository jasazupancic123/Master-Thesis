import { alpha } from '@mui/material';

import { theme } from '@/app/style';

export const LINEAR_GRADIENT_BG = `linear-gradient(135deg, ${theme.palette.background.dark} 0%, ${alpha(theme.palette.background.light, 0.5)} 100%, ${theme.palette.background.light} 100%)`;
