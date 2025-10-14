'use client';

import { AppBar, Box, Container } from '@mui/material';
import { useTheme } from '@mui/material';

import type { ChildrenProps } from '@/common/type/props.type';
import DashboardHeader from '@/components/dashboard/components/dashboard-header/dashboard-header';
import { MAX_WIDTH } from '@/components/trainer-group-day-view/constant/dimensions.constant';

export default function DashboardLayout({ children }: ChildrenProps) {
  const theme = useTheme();

  return (
    <Box>
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
          <AppBar
            position="fixed"
            sx={{
              width: '100%',
              transition: 'margin-left 0.3s ease-in-out',
              boxShadow: 'none',
              backgroundColor: theme.palette.background.default,
            }}
          >
            <DashboardHeader />
          </AppBar>

          <Box
            width="100%"
            display="flex"
            maxWidth={MAX_WIDTH}
            sx={{
              mt: '50px',
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
