'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

import ProfileInitializer from '@/initializers/profile.initializer';
import { withAuth } from '@/store/auth.provider';

export default withAuth(Layout);

function Layout({ children }: React.PropsWithChildren) {
  return (
    <Box bgcolor="background.default">
      <Container component="main" maxWidth="lg">
        <ProfileInitializer>{children}</ProfileInitializer>
      </Container>
    </Box>
  );
}
