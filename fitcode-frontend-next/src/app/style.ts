import { createTheme } from '@mui/material';

declare module '@mui/material/styles' {
  interface TypeBackground {
    default: string;
    paper: string;
    light: string;
    dark: string;
  }
}

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1EB980',
      dark: '#005d57',
    },
    background: {
      light: '#283444',
      default: '#263646',
      paper: '#1A2B3C',
      dark: '#6d7b87',
    },
    error: {
      main: '#ff6859',
    },
  },
  typography: {
    fontFamily: 'Roboto Condensed, sans-serif',
    button: { textTransform: 'none', color: '#EAEBED' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          color: '#EAEBED',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        a: {
          textDecoration: 'none',
          color: 'inherit',
          '&:hover': {
            textDecoration: 'none',
          },
          '&:active': {
            color: 'inherit',
          },
        },
      },
    },
  },
});

const robotoCondensed = {
  fontFamily: 'Roboto Condensed',
  fontWeight: 400,
};

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
  color: 'white', // Ensures button text is white
  textAlign: 'center',
};

export const titleStyle = {
  p: 3,
  bgcolor: 'rgba(0, 0, 0, 0.5)',
  borderRadius: 2,
  transition: 'transform 0.3s',
  color: 'white', // Title text is white
  '&:hover': { transform: 'scale(1.05)' },
};
