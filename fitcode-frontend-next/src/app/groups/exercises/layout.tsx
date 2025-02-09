'use client';

import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import PageTitle from '../components/page-title';
import { theme } from '@/app/style';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt="15px">
      <PageTitle title="Exercises" />
      <Box
        width="100%"
        p={0}
        mt={2}
        minHeight="calc(100vh - 136px)"
        sx={{ backgroundColor: theme.palette.background.paper }}
      >
        {children}
      </Box>
    </Box>
  );
}
