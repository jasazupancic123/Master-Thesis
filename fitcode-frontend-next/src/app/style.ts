import { createTheme } from '@mui/material';

declare module '@mui/material/styles' {
  interface TypeBackground {
    default: string;
    paper: string;
    light: string;
    dark: string;
    lightBorder: string;
    lightText: string;
  }
}

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#34FFBE',
      dark: '#005d57',
    },
    background: {
      light: '#363636',
      default: '#111111',
      dark: '#212121',
      paper: '#272727',
      lightBorder: '#968686',
      lightText: '#D5D5D5',
    },
    error: {
      main: '#ff6859',
    },
  },
  typography: {
    allVariants: {
      fontFamily: 'Inter, sans-serif',
      color: '#D9D9D9', // Replace with your desired color
    },
    button: { textTransform: 'none', color: '#EAEBED' },
  },
  components: {
    MuiPaper: {
      defaultProps: {
        elevation: 0, // to avoid overlay
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none', // disables elevation overlay in dark mode
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // disables elevation overlay in dark mode
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
