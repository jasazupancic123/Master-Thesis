import SearchIcon from '@mui/icons-material/Search';
import { Search, SearchIconWrapper, StyledInputBase } from './style';
import { SxProps } from '@mui/material';

export type SearchBarProps = {
  placeholder: string;
  value: string;
  handleSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  maxWidth?: string;
  sx?: SxProps;
};

export function SearchBar({
  placeholder,
  value,
  handleSearchChange,
  maxWidth,
  sx,
}: SearchBarProps) {
  return (
    <Search maxWidth={maxWidth} sx={sx}>
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
