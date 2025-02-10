export type SearchBarProps = {
  placeholder: string;
  value: string;
  handleSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  maxWidth?: string;
};
