'use client';

import React, { ReactNode } from 'react';
import Container from '@mui/material/Container';
import Sidebar from '@/components/sidebar';
import Box from '@mui/material/Box';
import { useAuth } from '@/context/auth-provider';
import { LOCAL_STORAGE_KEYS } from '@/common/constant/local-storage.constant';
import { useRouter } from 'next/navigation';
import { LINK_GROUPS } from '@/common/constant/navigation.constant';
import SidebarAthlete from '@/components/sidebar-athlete';
import { UserRole } from '@/controller/user/enum/user-role.enum';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  const { role } = useAuth();
  const router = useRouter();
  const isAthlete = role[0] === UserRole.ATHLETE;
  const isTrainer = role[0] === UserRole.TRAINER;

  const bgcolor = isTrainer ? 'background.default' : 'background.paper';
  const minHeight = `calc(100vh - ${isTrainer ? 64 : 0}px)`;

  //redirect to /id of group if it exists in local storage
  if (localStorage.getItem(LOCAL_STORAGE_KEYS.SELECTED_GROUP_ID)) {
    router.push(
      LINK_GROUPS.href +
        '/' +
        localStorage.getItem(LOCAL_STORAGE_KEYS.SELECTED_GROUP_ID)
    );
  }

  return (
    <Box bgcolor={bgcolor} minHeight={minHeight}>
      {isAthlete && <SidebarAthlete />}

      <Container
        component="main"
        maxWidth={false}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 0,
          pb: 2,
          mx: 0,
          width: '100%',
        }}
      >
        <Box mt="49px">{children}</Box>
      </Container>
    </Box>
  );
}
