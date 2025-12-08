'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

import { withAuth } from '@/store/auth.provider';

export default withAuth(Layout);

function Layout({ children }: React.PropsWithChildren) {
  return (
    <Box bgcolor="background.default">
      <Container component="main" maxWidth="lg">
        {children}
      </Container>
    </Box>
  );
}
