import { Box, ToggleButton, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import React from 'react';

import type { GroupDateFilter } from '@/common/type/filter.type';
import type { ILink } from '@/common/type/link.type';
import { useDashboard } from '@/store/dashboard-provider';
import { useGroup } from '@/store/group-provider';
import { useScreenSize } from '@/store/screen-size-provider';

interface Props {
  value: GroupDateFilter | ILink;
  disabled?: boolean;
  dashboardView?: boolean;
  numValues?: number;
}

export default function FilterButton(props: Props) {
  const { value, disabled = false, dashboardView, numValues } = props;

  const { filter } = dashboardView ? useDashboard() : useGroup();
  const theme = useTheme();
  const screenSize = useScreenSize();

  const isILink = (val: GroupDateFilter | ILink): val is ILink => {
    return val && typeof val === 'object' && 'href' in val && 'label' in val;
  };

  return (
    <ToggleButton
      value={isILink(value) ? value : value.toLowerCase()}
      disabled={disabled}
      sx={{
        width: numValues !== undefined ? `${100 / numValues}%` : '25%',
        maxWidth: numValues !== undefined ? `${100 / numValues}%` : '25%',
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
      {isILink(value) ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: filter === value ? theme.palette.primary.main : undefined,
          }}
        >
          {value.icon}
        </Box>
      ) : (
        <Typography
          variant="body2"
          sx={{
            fontSize: screenSize.isMobile ? '12px' : 12,
            color: filter === value ? theme.palette.primary.main : undefined,
          }}
        >
          {value.toUpperCase()}
        </Typography>
      )}
    </ToggleButton>
  );
}
