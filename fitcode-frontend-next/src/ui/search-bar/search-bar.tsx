import SearchIcon from '@mui/icons-material/Search';
import type { SxProps } from '@mui/material';
import { useTheme } from '@mui/material';

import { Search, SearchIconWrapper, StyledInputBase } from './style';

interface Props extends React.PropsWithChildren {
  placeholder: string;
  value: string;
  handleSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  maxWidth?: string;
  sx?: SxProps;
}

export function SearchBar({
  placeholder,
  value,
  handleSearchChange,
  maxWidth,
  sx,
  children,
}: Props) {
  const theme = useTheme();

  return (
    <Search
      maxWidth={maxWidth}
      sx={{
        ...sx,
        '& .MuiInputBase-root': {
          width: '100%',
          backgroundColor: theme.palette.background.light,
        },
      }}
    >
      <SearchIconWrapper>
        <SearchIcon
          sx={{
            color: theme.palette.text.primary + ' !important',
            zIndex: 1000,
          }}
        />
      </SearchIconWrapper>

      <StyledInputBase
        placeholder={placeholder}
        value={value}
        onChange={handleSearchChange}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
      />
      {children}
    </Search>
  );
}
