import React, { ReactNode } from 'react';
import { FormControl, InputAdornment, InputLabel } from '@mui/material';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { Training } from '@/controller/training/type/training.type';

interface Props {
  icon: ReactNode;
  label: string;
  value: string | number;
  setValue: (value: string | number) => void;
  items: Training[];
  displayFormat: 'from-to' | 'id';
}

export default function SelectInputObject({
  icon,
  label,
  value,
  setValue,
  items,
  displayFormat,
}: Props) {
  const formatTime = (date: Date | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  return (
    <FormControl sx={{ mr: 1, minWidth: 120 }}>
      <InputLabel id={`${label}-label`}>{label}</InputLabel>

      <Select
        variant="outlined"
        label={label}
        value={value}
        onChange={(e) => setValue(e.target.value as string | number)}
        startAdornment={
          <InputAdornment position="start">{icon}</InputAdornment>
        }
        sx={{
          color: '#fff',
          '.MuiOutlinedInput-notchedOutline': { border: 'none' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
          '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
        }}
      >
        <MenuItem value="" sx={{ minHeight: 20 }}>
          <em>None</em>
        </MenuItem>

        {items.map((item) => (
          <MenuItem key={item.id} value={item.id}>
            {displayFormat === 'from-to' && item.from && item.to
              ? `${formatTime(item.from)} - ${formatTime(item.to)}`
              : item.id}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
