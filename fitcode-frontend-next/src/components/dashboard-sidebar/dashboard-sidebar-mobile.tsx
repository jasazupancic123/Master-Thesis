'use client';

import { Menu as MenuIcon } from '@mui/icons-material';
import { Box, Drawer, IconButton } from '@mui/material';
import { useState } from 'react';

import DashboardSidebar from './dashboard-sidebar';
import { theme } from '@/app/style';

export default function DashboardSidebarMobile() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const DRAWER_WIDTH = 170;

  return (
    <>
      {/* Floating button to open drawer */}
      <IconButton
        aria-label="Open dashboard menu"
        onClick={() => setDrawerOpen(true)}
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          backgroundColor: theme.palette.background.default,
          boxShadow: 1,
          zIndex: 10,
        }}
      >
        <MenuIcon />
      </IconButton>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }} // better perf on mobile
        sx={{ zIndex: 90 }}
      >
        <Box
          role="presentation"
          height="100%"
          sx={{
            width: DRAWER_WIDTH,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'space-between',
          }}
        >
          <DashboardSidebar setDrawerOpen={setDrawerOpen} />
        </Box>
      </Drawer>
    </>
  );
}
