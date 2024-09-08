import MenuItem from '@mui/material/MenuItem';
import { FormControl, InputLabel, Select } from '@mui/material';
import React from 'react';

interface SelectEnumProps {
  enumObject: any;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export default function SelectEnum(props: SelectEnumProps) {
  const { enumObject, label, value, onChange } = props;

  return <FormControl fullWidth>
    <InputLabel id={enumObject.name}>{label}</InputLabel>
    <Select
      labelId={enumObject.name}
      value={value}
      label={label}
      variant='outlined'
      onChange={(e) => onChange(e.target.value as string)}
    >
      <MenuItem value={''}>None</MenuItem>
      {Object.entries(enumObject).map(([key, val]) => (
        <MenuItem key={key} value={val as string}>
          {val as string}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
}