import React, { ReactNode } from 'react';
import { FormControl, InputAdornment, InputLabel } from '@mui/material';
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

export default function SelectInput<T>(props: Props<T>) {
  return <FormControl sx={{ mr: 1, minWidth: 120 }}>
    <InputLabel
      id={`${props.label}-label`}
    >
      {props.label}
    </InputLabel>

    <Select
      variant="outlined"
      label={props.label}
      value={props.value}
      onChange={(e) => props.setValue(e.target.value as string | number)}
      startAdornment={
        <InputAdornment position="start">
          {props.icon}
        </InputAdornment>
      }
      sx={{
        color: '#fff',
        '.MuiOutlinedInput-notchedOutline': { border: 'none' },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
        '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
      }}
    >
      <MenuItem value="">
        <em>None</em>
      </MenuItem>

      {props.items.map((item, i) => (
        <MenuItem key={i} value={item[props.itemKey]}>
          {item[props.itemName]}
        </MenuItem>
      ))}
    </Select>
  </FormControl>;
}