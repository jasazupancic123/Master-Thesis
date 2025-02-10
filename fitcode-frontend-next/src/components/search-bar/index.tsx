import SearchIcon from '@mui/icons-material/Search';
import { Search, SearchIconWrapper, StyledInputBase } from './style';
import { SearchBarProps } from './type';

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
