import { ToggleButton, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import React from 'react';

import type { GroupDateFilter } from '@/common/type/filter.type';
import type { ILink } from '@/common/type/link.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useGroup } from '@/store/group.provider';
import { useScreenSize } from '@/store/screen-size.provider';

interface Props {
  value: GroupDateFilter | ILink;
  disabled?: boolean;
  dashboardView?: boolean;
  numValues?: number;
}

export default function FilterButton(props: Props) {
  const { value, disabled = false, dashboardView, numValues } = props;

  const screenSize = useScreenSize();

  const dashboard = useDashboard() ?? {};
  const group = useGroup() ?? {};

  const { filter } = dashboardView ? dashboard : group;

  const theme = useTheme();

  const isILink = (val: GroupDateFilter | ILink): val is ILink => {
    return val && typeof val === 'object' && 'href' in val && 'label' in val;
  };

  return (
    <ToggleButton
      value={isILink(value) ? value : value.toLowerCase()}
      disabled={disabled}
      sx={
        dashboardView
          ? {
              width: numValues !== undefined ? `${100 / numValues}%` : '25%',
              maxWidth: numValues !== undefined ? `${100 / numValues}%` : '25%',
              color:
                filter === value ? theme.palette.text.secondary : undefined,
              '&.MuiButtonBase-root': {
                height: '30px',
                borderRadius: '12px',
                py: 1,
                px: 1,
                backgroundColor:
                  filter === value ? theme.palette.primary.main : undefined,
                zIndex: filter === value ? 10 : 1,
              },
              border: 'none',
              '&:hover': {
                backgroundColor:
                  filter === value
                    ? `${theme.palette.primary.main} !important`
                    : `${theme.palette.background.default} !important`,
              },
              textTransform: 'none',
            }
          : {
              width: '20%',
              maxWidth: '20%',
              '&.MuiButtonBase-root': {
                height: '30px',
                borderRadius: '12px',
                py: 1,
                px: 1,
                backgroundColor:
                  filter === value ? theme.palette.primary.main : undefined,
                zIndex: filter === value ? 10 : 1,
              },
              border: 'none',
              '&:hover': {
                backgroundColor:
                  filter === value
                    ? `${theme.palette.primary.main} !important`
                    : `${theme.palette.background.default} !important`,
              },
              textTransform: 'none',
            }
      }
    >
      <Typography
        sx={{
          fontSize: screenSize.isUltraSmall
            ? 8
            : screenSize.isSmallMobile
              ? 10
              : screenSize.isMobile
                ? 12
                : 16,
          fontWeight: filter === value ? 800 : 400,
          color: filter === value ? theme.palette.text.secondary : undefined,
          textTransform: 'uppercase',
        }}
      >
        {isILink(value) ? value.label : value.toUpperCase()}
      </Typography>
    </ToggleButton>
  );
}
