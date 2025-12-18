import { theme } from '@/app/style';
import { useDashboard } from '@/store/dashboard.provider';
import { ArrowDropDown } from '@mui/icons-material';
import { Box, Typography, Menu, SxProps } from '@mui/material';
import { useRef, useState } from 'react';

interface Props {
  sx?: SxProps;
}

export default function DashboardGroupFilter(props: Props) {
  const { filterGroups, setFilterGroups, groupFilterItems } = useDashboard();

  const { sx } = props;

  const [openFilterGroupsMenu, setOpenFilterGroupsMenu] =
    useState<boolean>(false);
  const anchorEl = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <Box
        ref={anchorEl}
        width={200}
        display="flex"
        justifyContent="center"
        alignItems="center"
        onClick={() => {
          setOpenFilterGroupsMenu(true);
        }}
        sx={{
          backgroundColor: theme.palette.text.primary,
          py: 1,
          borderRadius: 10,
          cursor: 'pointer',
          position: 'relative',
          ...sx,
        }}
      >
        <Typography
          maxWidth={140}
          sx={{
            color: theme.palette.text.secondary,
            fontSize: 12,
            fontWeight: 600,
            userSelect: 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {filterGroups.label}
        </Typography>
        <ArrowDropDown
          fontSize="small"
          sx={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: theme.palette.text.secondary,
          }}
        />
      </Box>

      <Menu
        anchorEl={anchorEl.current}
        open={openFilterGroupsMenu}
        onClose={() => {
          setOpenFilterGroupsMenu(false);
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{
          top: 36,
        }}
      >
        {groupFilterItems.map((filter) => (
          <Box
            key={filter.id}
            width={200}
            onClick={() => {
              setFilterGroups(filter);
              setOpenFilterGroupsMenu(false);
            }}
            sx={{
              px: 2,
              py: 1,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <Typography
              sx={{
                color: theme.palette.text.primary,
                fontSize: 12,
                fontWeight: 600,
                userSelect: 'none',
              }}
            >
              {filter.label}
            </Typography>
          </Box>
        ))}
      </Menu>
    </>
  );
}
