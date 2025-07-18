import { useScreenSize } from '@/store/screen-size-provider';
import { FormControl, InputAdornment } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import React, { ReactNode } from 'react';
import { useTheme } from '@mui/material';

interface Props<T> {
  icon: ReactNode;
  label: string;
  value: string | number;
  setValue: (value: string | number) => void;
  items: T[];
  itemKey: keyof T;
  itemName: keyof T;
}

export default function SelectInputHorizontal<T>(props: Props<T>) {
  const theme = useTheme();
  const screenSize = useScreenSize();
  return (
    <FormControl
      sx={{
        mr: 1,
        minWidth: screenSize.isUltraSmall ? 100 : 120,
        maxWidth: screenSize.isUltraSmall
          ? 100
          : screenSize.isMobile
            ? 140
            : undefined,
      }}
    >
      <Select
        variant="outlined"
        value={props.value}
        onChange={(e) => props.setValue(e.target.value as string | number)}
        startAdornment={
          <InputAdornment
            position="start"
            sx={{
              color: theme.palette.text.primary,
            }}
          >
            {props.icon}
          </InputAdornment>
        }
        native={false}
        displayEmpty
        renderValue={(selected) => {
          if (!selected) return <em>{props.label}</em>;

          const selectedItem = props.items.find(
            (item) => (item[props.itemKey] as unknown as string) === selected
          );

          return selectedItem ? (
            (selectedItem[props.itemName] as unknown as string)
          ) : (
            <em>{props.label}</em>
          );
        }}
        sx={{
          color: theme.palette.text.primary,
          '.MuiOutlinedInput-notchedOutline': { p: 0, border: 'none' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
          '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
          '.MuiSelect-icon': {
            color: theme.palette.text.primary,
          },
          p: screenSize.isMobile ? 0 : undefined,

          // 👇 Hides the internal <input>
          '.MuiSelect-select': {
            padding: 0,
          },
        }}
      >
        {props.items.map((item, i) => (
          <MenuItem key={i} value={item[props.itemKey] as unknown as string}>
            {item[props.itemName] as unknown as string}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
