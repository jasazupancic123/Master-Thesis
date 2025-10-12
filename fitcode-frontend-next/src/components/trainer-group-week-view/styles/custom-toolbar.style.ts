import type { SxProps, Theme } from '@mui/material';

export const customScrollBarStyle = (theme: Theme): SxProps => {
  return {
    '&::-webkit-scrollbar-track': {
      backgroundColor: theme.palette.background.default, // track color
      borderRadius: 4,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: theme.palette.text.disabled, // thumb color
      borderRadius: 4,
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: theme.palette.text.disabled, // thumb hover
    },

    /* Firefox */
    scrollbarWidth: 'thin', // "auto" | "thin" | "none"
    scrollbarColor: `${theme.palette.text.disabled} ${theme.palette.background.default}`,
  };
};
