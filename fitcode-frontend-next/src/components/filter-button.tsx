import { GroupDateFilter } from '@/common/type/filter.type';
import { ToggleButton } from '@mui/material';
import React from 'react';

interface Props {
  value: GroupDateFilter;
  disabled?: boolean;
}

export default function FilterButton(props: Props) {
  const { value, disabled = false } = props;

  return (
    <ToggleButton
      value={value.toLowerCase()}
      disabled={disabled}
      sx={{
        width: '25%',
        px: 2,
        py: 0.75,
        color: '#fff',
        backgroundColor: 'background.default',
        '&.Mui-selected': {
          backgroundColor: '#1EB980',
          color: '#fff',
          borderBottomLeftRadius: '80px',
          borderBottomRightRadius: '80px',
        },
        border: 'none',
        borderBottomLeftRadius: '50px',
        borderBottomRightRadius: '50px',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          color: '#fff',
        },
        textTransform: 'none',
      }}
    >
      {value.toUpperCase()}
    </ToggleButton>
  );
}
