import { FilterType } from '@/common/type/filter.type';
import { ToggleButton } from '@mui/material';
import React from 'react';
import { useScreenSize } from '@/context/screen-size-provider';

interface Props {
  value: FilterType;
  disabled?: boolean;
}

export default function FilterButton(props: Props) {
  const screenSize = useScreenSize();
  const { value, disabled = false } = props;

  return (
    <ToggleButton
      value={value.toLowerCase()}
      disabled={disabled}
      sx={{
        width: '25%',
        px: 2,
        color: '#fff',
        backgroundColor: '#303E4A',
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
