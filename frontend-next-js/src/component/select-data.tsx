import MenuItem from '@mui/material/MenuItem';
import { FormControl, InputLabel, Select } from '@mui/material';
import React from 'react';

interface SelectDataProps<T> {
  data: T[];
  label: string;
  value: string;
  onChange: (value: string) => void;
  dataKeyProp?: keyof T;
  dataValueProp?: keyof T;
}

export default function SelectData<T>(props: SelectDataProps<T>) {
  const {
    data,
    label,
    value,
    onChange,
    dataKeyProp,
    dataValueProp
  } = props;

  return <FormControl fullWidth>
    <InputLabel id={label}>{label}</InputLabel>
    <Select
      labelId={label}
      value={value}
      label={label}
      variant='outlined'
      onChange={(e) => onChange(e.target.value as string)}
    >
      <MenuItem value={''}>None</MenuItem>
      {data.map((obj) => (
        <MenuItem
          key={dataKeyProp ? obj[dataKeyProp] : obj as string}
          value={dataKeyProp ? obj[dataKeyProp] : obj as string}
        >
          {dataValueProp ? obj[dataValueProp] : obj as string}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
}