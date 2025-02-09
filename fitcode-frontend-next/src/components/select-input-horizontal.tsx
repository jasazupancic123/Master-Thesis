import React, { ReactNode } from 'react';
import {
  FormControl,
  InputAdornment,
  InputLabel,
  Box,
  Stack,
} from '@mui/material';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

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
  return (
    <FormControl sx={{ mr: 1, minWidth: 120 }}>
      <Select
        variant="outlined"
        value={props.value}
        onChange={(e) => props.setValue(e.target.value as string | number)}
        startAdornment={
          <InputAdornment position="start">{props.icon}</InputAdornment>
        }
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
          color: '#fff',
          '.MuiOutlinedInput-notchedOutline': { border: 'none' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
          '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
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
