import SearchIcon from '@mui/icons-material/Search';
import { Search, SearchIconWrapper, StyledInputBase } from './style';
import { SxProps } from '@mui/material';
import { ChildrenProps } from '@/common/type/props.type';

export type SearchBarProps = {
  placeholder: string;
  value: string;
  handleSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  maxWidth?: string;
  sx?: SxProps;
  children?: ChildrenProps['children'];
};

export function SearchBar({
  placeholder,
  value,
  handleSearchChange,
  maxWidth,
  sx,
  children,
}: SearchBarProps) {
  return (
    <Search
      maxWidth={maxWidth}
      sx={{ ...sx, '& .MuiInputBase-root': { width: '100%' } }}
    >
      <SearchIconWrapper>
        <SearchIcon />
      </SearchIconWrapper>

      <StyledInputBase
        placeholder={placeholder}
        value={value}
        onChange={handleSearchChange}
      />
      {children}
    </Search>
  );
}
