import { FormControl, InputAdornment, InputLabel } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import React, { ReactNode } from 'react';

interface Props<T> {
  icon: ReactNode;
  label: string;
  value: string | number;
  setValue: (value: string | number) => void;
  items: T[];
  itemKey: keyof T;
  itemName: keyof T;
  placeholder?: string;
  displayInputLabel?: boolean;
}

export default function SelectInput<T>(props: Props<T>) {
  return (
    <FormControl sx={{ mr: 1, minWidth: 120 }}>
      {props.displayInputLabel === true ? (
        <></>
      ) : (
        <InputLabel id={`${props.label}-label`}>{props.label}</InputLabel>
      )}

      <Select
        variant="outlined"
        label={props.label}
        value={props.value}
        onChange={(e) => props.setValue(e.target.value as string | number)}
        startAdornment={
          <InputAdornment position="start">{props.icon}</InputAdornment>
        }
        displayEmpty={props.placeholder ? true : false}
        sx={{
          color: '#fff',
          '.MuiOutlinedInput-notchedOutline': { border: 'none' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
          '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
        }}
      >
        <MenuItem value="" sx={{ minHeight: 20 }}>
          <em>{props.placeholder ? props.placeholder : <>None</>}</em>
        </MenuItem>

        {props.items.map((item, i) => (
          <MenuItem key={i} value={item[props.itemKey] as unknown as string}>
            {item[props.itemName] as unknown as string}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
