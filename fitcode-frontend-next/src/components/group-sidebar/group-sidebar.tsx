'use client';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import TrainerGroupHeader from '../trainer-group-header/trainer-group-header';
import { AppBar } from './style';
import { useGroup } from '@/store/group.provider';

export default function GroupSidebar() {
  const { filter, setFilter } = useGroup();
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        backgroundColor: 'red',
      }}
    >
      <AppBar
        position="fixed"
        sx={{
          width: '100%',
          transition: 'margin-left 0.3s ease-in-out',
          boxShadow: 'none',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Box width="100%" sx={{ marginX: 'auto' }}>
          <TrainerGroupHeader filter={filter} setFilter={setFilter} />
        </Box>
      </AppBar>
    </Box>
  );
}
