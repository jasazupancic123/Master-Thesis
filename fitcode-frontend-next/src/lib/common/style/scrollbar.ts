import type { SxProps, Theme } from '@mui/material';

export const styledScrollbarSx = (
  theme: Theme,
  disableThin?: boolean
): SxProps<Theme> => ({
  /* Firefox */
  scrollbarWidth: !disableThin ? 'thin' : 'auto',
  scrollbarColor: `${theme.palette.text.primary} ${theme.palette.action.hover}`,

  /* WebKit (Chrome/Edge/Safari) */
  '&::-webkit-scrollbar': {
    height: 10,
    width: 10,
  },
  '&::-webkit-scrollbar-track': {
    background: `linear-gradient(90deg, ${theme.palette.action.hover}, ${theme.palette.action.selected})`,
    borderRadius: 999,
  },
  '&::-webkit-scrollbar-thumb': {
    borderRadius: 999,
    background: `linear-gradient(180deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
    boxShadow: 'inset 0 0 0 2px red',
    transition: 'background 0.2s ease, box-shadow 0.2s ease',
  },
  '&:hover::-webkit-scrollbar-thumb': {
    background: `linear-gradient(180deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
    boxShadow: 'inset 0 0 0 2px red',
  },
  '&::-webkit-scrollbar-corner': {
    background: 'transparent',
  },
});
