import { Menu, MenuItem, SxProps } from '@mui/material';

interface Props<T> {
  anchorEl: HTMLElement | null;
  open: boolean;
  items: T[];
  idPropertyName: keyof T;
  valuePropertyName: keyof T;
  namePropertyName: keyof T;
  onClose: () => void;
  onMenuItemClick: (e: React.MouseEvent<HTMLElement>, id: string) => void;
  anchorOrigin?: {
    vertical: 'top' | 'bottom' | 'center';
    horizontal: 'left' | 'right' | 'center';
  };
  transformOrigin?: {
    vertical: 'top' | 'bottom' | 'center';
    horizontal: 'left' | 'right' | 'center';
  };
  menuSx?: SxProps;
  menuItemsSx?: (id: string) => SxProps;
  options?: {
    sortByPropertyName?: keyof T;
  };
}

export default function MenuItemsList<T>(props: Props<T>) {
  const {
    anchorEl,
    open,
    items,
    idPropertyName,
    valuePropertyName,
    namePropertyName,
    onClose,
    onMenuItemClick,
    anchorOrigin,
    transformOrigin,
    menuSx,
    menuItemsSx,
    options,
  } = props;

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      sx={menuSx}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
    >
      {items
        .sort((a, b) => {
          if (options?.sortByPropertyName) {
            return (a[options.sortByPropertyName] as string).localeCompare(
              b[options.sortByPropertyName] as string
            );
          }

          return 0;
        })
        .map((c) => (
          <MenuItem
            key={c[idPropertyName] as string}
            value={c[valuePropertyName] as string}
            onClick={(e) => {
              e.stopPropagation();

              const id = c[idPropertyName] as string;

              onMenuItemClick(e, id);
            }}
            sx={menuItemsSx ? menuItemsSx(c[idPropertyName] as string) : {}}
          >
            {c[namePropertyName] as string}
          </MenuItem>
        ))}
    </Menu>
  );
}
