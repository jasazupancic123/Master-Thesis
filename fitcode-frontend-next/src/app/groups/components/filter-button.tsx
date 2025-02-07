import { ToggleButton } from '@mui/material';
import React from 'react';
import { FilterType } from '@/group/type/filter.type';

interface Props {
  value: FilterType;
  disabled?: boolean;
}

export default function FilterButton(props: Props) {
  const { value, disabled = false } = props;

  return (
    <ToggleButton
      value={value.toLowerCase()}
      disabled={disabled}
      sx={{
        flex: 1,
        color: '#fff',
        backgroundColor: '#303E4A',
        borderColor: '#303E4A',
        borderWidth: 1,
        borderRadius: '0 0 30px 30px',
        '&.Mui-selected': {
          backgroundColor: '#1EB980',
          color: '#fff',
        },
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          color: '#fff',
        },
        textTransform: 'none',
        p: 1,
      }}
    >
      {value.toUpperCase()}
    </ToggleButton>
  );
}
