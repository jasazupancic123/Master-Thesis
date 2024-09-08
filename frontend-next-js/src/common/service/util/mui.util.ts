import { createTheme } from '@mui/material';

export class MuiUtil {
  theme() {
    return createTheme({
      palette: {
        mode: 'dark',
        primary: {
          main: '#0f9d58',
        },
        background: {
          default: '#303E4A',
          paper: '#1A2B3C',
        },
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        button: { textTransform: 'none' },
      },
    });
  }
}