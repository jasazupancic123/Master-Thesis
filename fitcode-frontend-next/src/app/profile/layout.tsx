'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

import type { ChildrenProps } from '@/common/type/props.type';
import ProfileInitializer from '@/initializers/profile.initializer';
import { withAuth } from '@/store/auth.provider';
import MainProvider from '@/store/main.provider';

export default withAuth(Layout);

function Layout({ children }: ChildrenProps) {
  return (
    <Box bgcolor="background.default">
      <Container component="main" maxWidth="lg">
        <MainProvider>
          <ProfileInitializer>{children}</ProfileInitializer>
        </MainProvider>
      </Container>
    </Box>
  );
}
