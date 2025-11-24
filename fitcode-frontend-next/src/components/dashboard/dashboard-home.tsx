import { Box, Typography } from '@mui/material';

import DashboardPageContainer from './dashboard-page-container';
import { useAuthenticatedAuth } from '@/store/auth.provider';

export default function DashboardHome() {
  const { user } = useAuthenticatedAuth();

  return (
    <DashboardPageContainer>
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        sx={{
          p: 1,
        }}
      >
        <Typography variant="h4">
          Welcome back, <strong>{user.displayName?.split(' ')[0]}</strong>
        </Typography>
      </Box>
    </DashboardPageContainer>
  );
}
