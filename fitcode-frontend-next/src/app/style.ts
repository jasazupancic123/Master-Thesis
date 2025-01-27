import { createTheme } from '@mui/material';

export const theme = createTheme({
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

export const signInUpTheme = createTheme({
  ...theme,
  palette: {
    ...theme.palette,
    mode: 'light',
    text: {
      primary: '#333333',
    },
  },
});

export const buttonStyle = {
  p: 2,
  bgcolor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 2,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  color: 'white',
  textAlign: 'center',
};

export const titleStyle = {
  p: 3,
  bgcolor: 'rgba(0, 0, 0, 0.5)',
  borderRadius: 2,
  transition: 'transform 0.3s',
  '&:hover': { transform: 'scale(1.05)' },
};
