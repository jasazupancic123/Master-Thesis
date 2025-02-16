import { alpha, InputBase, styled } from '@mui/material';
import { useScreenSize } from '@/context/screen-size-provider';

export const Search = styled('div', {
  shouldForwardProp: (prop) => prop !== 'maxWidth',
})<{ maxWidth?: string }>(({ theme, maxWidth }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  maxWidth: maxWidth || '100%',
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    width: 'auto',
  },
}));

export const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: useScreenSize().isMobile ? theme.spacing(0, 1) : theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: useScreenSize().isMobile
      ? `calc(1em + ${theme.spacing(2)})`
      : `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
  '& .MuiInputBase-input::placeholder': {
    whiteSpace: 'nowrap', // Prevents placeholder from wrapping
    overflow: 'hidden', // Clips overflowing text
    textOverflow: 'ellipsis', // Shows "..." when text is too long
    display: 'block', // Ensures it works correctly
  },
}));
