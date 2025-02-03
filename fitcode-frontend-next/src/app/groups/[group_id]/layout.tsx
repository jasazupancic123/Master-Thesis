'use client';

import React, { ReactNode } from 'react';
import Container from '@mui/material/Container';
import Sidebar from '@/common/components/sidebar';
import Box from '@mui/material/Box';
import { useAuth } from '@/context/auth-provider';
import { UserRole } from '@/user/enum/user-role.enum';
import SidebarAthlete from '@/user/components/sidebar-athlete';
import MiniSidebar from '@/common/components/groups-sidebar';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  const { role } = useAuth();
  const isAthlete = role[0] === UserRole.ATHLETE;
  const isTrainer = role[0] === UserRole.TRAINER;

  const bgcolor = isTrainer ? 'background.default' : 'background.paper';
  const minHeight = `calc(100vh - ${isTrainer ? 64 : 0}px)`;

  return (
    <Box bgcolor={bgcolor} minHeight={minHeight}>
      {isAthlete && <SidebarAthlete />}

      <Container
        component="main"
        maxWidth="lg"
        sx={{ display: 'flex', flexDirection: 'column' }}
      >
        <Box mt={2}>{children}</Box>
      </Container>
    </Box>
  );
}
