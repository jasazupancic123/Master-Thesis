import { FormControl, InputLabel, Select } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import React from 'react';

interface Props {
  enumObject: any;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export default function SelectEnum(props: Props) {
  const { enumObject, label, value, onChange } = props;

  return (
    <FormControl fullWidth>
      <InputLabel id={enumObject.name}>{label}</InputLabel>
      <Select
        labelId={enumObject.name}
        value={value}
        label={label}
        variant="outlined"
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
  );
}
