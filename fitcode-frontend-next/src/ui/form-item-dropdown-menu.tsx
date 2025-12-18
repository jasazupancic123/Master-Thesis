import { theme } from '@/app/style';
import { ModalProps } from '@/lib/common/type/modal-props.type';
import { ArrowDropUp, ArrowDropDown } from '@mui/icons-material';
import { Box, Typography, Menu, MenuItem } from '@mui/material';
import { useRef } from 'react';

interface Props<K> {
  value: K | undefined;
  values: K[];
  key?: keyof K;
  onItemSelect: (item: K) => void;
}

export default function FormItemDropdownMenu<K>(props: Props<K> & ModalProps) {
  const { value, values, key, onItemSelect, open, setOpen } = props;

  const anchorElRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <Box
        ref={anchorElRef}
        width="100%"
        height={42}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        onClick={() => setOpen(true)}
        sx={{
          borderRadius: 10,
          border: `1px solid ${theme.palette.divider}`,
          cursor: 'pointer',
          position: 'relative',
          px: 1.5,
        }}
      >
        <Typography>
          {!value
            ? ''
            : key
              ? String(value[key])[0].toUpperCase() +
                String(value[key]).slice(1)
              : String(value)[0].toUpperCase() + String(value).slice(1)}
        </Typography>
        {open ? (
          <ArrowDropUp fontSize="small" />
        ) : (
          <ArrowDropDown fontSize="small" />
        )}
      </Box>
      <Menu
        anchorEl={anchorElRef.current}
        open={open}
        onClose={() => setOpen(false)}
      >
        {values.map((value, i) => (
          <MenuItem
            key={i}
            onClick={() => {
              onItemSelect(value);
              setOpen(false);
            }}
          >
            {key
              ? String(value[key])[0].toUpperCase() +
                String(value[key]).slice(1)
              : String(value)[0].toUpperCase() + String(value).slice(1)}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
