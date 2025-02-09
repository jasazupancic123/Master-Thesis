import { styled, alpha } from '@mui/material/styles';
import InputBase from '@mui/material/InputBase';
import SearchIcon from '@mui/icons-material/Search';
import { SearchBarProps } from '@/common/type/search-bar.type';

// ✅ Fix: Ensure `maxWidth` is properly passed as a prop
const Search = styled('div', {
  shouldForwardProp: (prop) => prop !== 'maxWidth',
})<{ maxWidth?: string }>(({ theme, maxWidth }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  maxWidth: maxWidth || '100%', // ✅ Fix: Use `maxWidth` with a default value
  width: '100%', // Ensures it expands correctly
  [theme.breakpoints.up('sm')]: {
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

export function SearchBar({
  placeholder,
  value,
  handleSearchChange,
  maxWidth,
}: SearchBarProps) {
  return (
    <Search maxWidth={maxWidth}>
      <SearchIconWrapper>
        <SearchIcon />
      </SearchIconWrapper>
      <StyledInputBase
        placeholder={placeholder}
        value={value}
        onChange={handleSearchChange}
      />
    </Search>
  );
}
