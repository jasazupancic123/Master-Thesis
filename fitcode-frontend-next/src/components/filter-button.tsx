import { FilterType } from '@/common/type/filter.type';
import { ToggleButton } from '@mui/material';
import React from 'react';

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
        width: 500,
        px: 2,
        flex: 1,
        color: '#fff',
        backgroundColor: 'background.paper',
        '&.Mui-selected': {
          backgroundColor: '#1EB980',
          color: '#fff',
          borderBottomLeftRadius: '500px',
          borderBottomRightRadius: '500px',
        },
        border: 'none',
        borderBottomLeftRadius: '500px',
        borderBottomRightRadius: '500px',
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
