'use client';

import { Box, Container } from '@mui/material';

import type { ChildrenProps } from '@/common/type/props.type';
import DashboardHeader from '@/components/dashboard-header/dashboard-header';
import { MAX_WIDTH } from '@/components/trainer-day-view/constant';

export default function DashboardLayout({ children }: ChildrenProps) {
  const styles = {
    bgcolor: 'background.default',
    minHeight: `calc(100vh - ${64}px)`,
  };

  return (
    <Box {...styles}>
      <Container
        component="main"
        maxWidth={false}
        disableGutters
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 0,
          pb: 2,
          mx: 0,
          width: '100%',
        }}
      >
        <Box width="100%" display="flex" flexDirection="column">
          <DashboardHeader />

          <Box
            width="100%"
            display="flex"
            maxWidth={MAX_WIDTH}
            sx={{
              mx: 'auto',
            }}
          >
            <Box
              sx={{
                flex: 1,
                overflow: 'hidden',
              }}
            >
              {children}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
