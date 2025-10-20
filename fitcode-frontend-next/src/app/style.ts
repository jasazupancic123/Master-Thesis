import { createTheme } from '@mui/material';

declare module '@mui/material/styles' {
  interface TypeBackground {
    default: string;
    paper: string;
    light: string;
    dark: string;
    lightBorder: string;
    darkBorder: string;
    lightText: string;
    textBackground: string;
    divider: string;
  }
}

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#EAFF48',
    },
    secondary: {
      main: '#FFD734',
    },
    background: {
      light: '#171717',
      default: '#111111',
      dark: '#212121',
      paper: '#212121',
      lightBorder: '#968686',
      darkBorder: '#212121',
      lightText: '#D5D5D5',
      textBackground: '#5C5555',
      divider: '#272727',
    },
    error: {
      main: '#ff6859',
    },
    text: {
      primary: '#D9D9D9', // Replace with your desired color
      secondary: '#222222', // When on yellow buttons and such
    },
  },
  typography: {
    allVariants: {
      fontFamily: "'Onest', sans-serif",
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
    MuiTextField: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& input:-webkit-autofill': {
            WebkitBoxShadow: `0 0 0 100px ${theme.palette.background.paper} inset`,
            WebkitTextFillColor: theme.palette.text.primary,
            transition: 'background-color 5000s ease-in-out 0s',
          },
        }),
      },
    },
  },
});
