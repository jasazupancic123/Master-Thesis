import { GroupDateFilter } from '@/common/type/filter.type';
import { ToggleButton, Typography } from '@mui/material';
import React from 'react';
import { useTheme } from '@mui/material';
import { useScreenSize } from '@/store/screen-size-provider';
import { useGroup } from '@/store/group-provider';

interface Props {
  value: GroupDateFilter;
  disabled?: boolean;
}

export default function FilterButton(props: Props) {
  const { filter } = useGroup();
  const theme = useTheme();
  const screenSize = useScreenSize();

  const { value, disabled = false } = props;

  return (
    <ToggleButton
      value={value.toLowerCase()}
      disabled={disabled}
      sx={{
        width: '25%',
        '&.MuiButtonBase-root': {
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          backgroundColor: theme.palette.background.light,
        },
        border: 'none',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          color: '#fff',
        },
        textTransform: 'none',
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontSize: screenSize.isMobile ? '12px' : '16px',
          color: filter === value ? theme.palette.primary.main : undefined,
        }}
      >
        {value.toUpperCase()}
      </Typography>
    </ToggleButton>
  );
}
