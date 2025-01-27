import MenuItem from '@mui/material/MenuItem';
import { FormControl, InputLabel, Select } from '@mui/material';
import React from 'react';

interface Props<T> {
  data: T[];
  label: string;
  value: any | any[];
  onChange: (value: Props<T>['value']) => void;
  dataKeyProp?: keyof T;
  dataValueProp?: keyof T;
  multiple?: boolean;
}

export default function SelectData<T>(props: Props<T>) {
  const {
    data,
    label,
    value,
    onChange,
    dataKeyProp,
    dataValueProp,
    multiple = false,
  } = props;

  return <FormControl fullWidth>
    <InputLabel id={label}>{label}</InputLabel>
    <Select
      multiple={multiple}
      labelId={label}
      value={value}
      label={label}
      variant="outlined"
      onChange={(e) => onChange(e.target.value as string)}
    >
      <MenuItem value={''}>None</MenuItem>
      {data.map((obj) => (
        <MenuItem
          key={dataKeyProp ? obj?.[dataKeyProp] as string : obj as string}
          value={dataKeyProp ? obj?.[dataKeyProp] as string : obj as string}
        >
          {dataValueProp ? obj?.[dataValueProp] as string : obj as string}
        </MenuItem>
      ))}
    </Select>
  </FormControl>;
}