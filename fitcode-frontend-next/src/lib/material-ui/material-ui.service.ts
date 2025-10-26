import type { SxProps, Theme } from '@mui/material';

export class MaterialUIService {
  getBlackTextFieldStyle(theme: Theme): SxProps<Theme> {
    return {
      color: theme.palette.text.secondary,

      '& .MuiInputBase-input': {
        color: theme.palette.text.secondary,
        fontWeight: 600,
      },

      '& .MuiInputLabel-root, & .MuiInputLabel-root.Mui-focused': {
        color: theme.palette.text.secondary,
      },

      '& .MuiFormHelperText-root, & .MuiFormHelperText-root.Mui-error': {
        color: theme.palette.text.secondary,
      },

      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: `${theme.palette.text.secondary} !important`,
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: `${theme.palette.text.secondary} !important`,
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: `${theme.palette.text.secondary} !important`,
      },

      // underline (standard)
      '&& .MuiInput-underline:before': {
        borderBottomColor: theme.palette.text.secondary,
      },
      '&& .MuiInput-underline:hover:not(.Mui-disabled):before': {
        borderBottomColor: theme.palette.text.secondary,
      },
      '&& .MuiInput-underline:after': {
        borderBottomColor: theme.palette.text.secondary,
      },
      '&& .MuiInput-underline.Mui-error:after': {
        borderBottomColor: theme.palette.text.secondary,
      },
      '&& .MuiInput-underline.Mui-disabled:before': {
        borderBottomColor: theme.palette.text.secondary,
      },

      // Autofill (WebKit)
      '& input:-webkit-autofill, & textarea:-webkit-autofill': {
        WebkitTextFillColor: theme.palette.text.secondary,
        WebkitBoxShadow: '0 0 0 1000px transparent inset',
        transition: 'background-color 9999s ease-out 0s',
        caretColor: theme.palette.text.secondary,
      },
      '& input:-webkit-autofill:focus, & textarea:-webkit-autofill:focus': {
        WebkitTextFillColor: theme.palette.text.secondary,
        WebkitBoxShadow: '0 0 0 1000px transparent inset',
        caretColor: theme.palette.text.secondary,
      },

      // Autofill (Firefox)
      '& input:-moz-autofill, & textarea:-moz-autofill': {
        boxShadow: '0 0 0 1000px transparent inset',
        color: theme.palette.text.secondary,
        caretColor: theme.palette.text.secondary,
      },
    };
  }
}
