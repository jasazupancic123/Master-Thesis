import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

import type { ChildrenProps } from '@/common/type/props.type';
import ProfileInitializer from '@/initializers/profile.initializer';

export default function Layout({ children }: ChildrenProps) {
  return (
    <Box bgcolor="background.default">
      <Container component="main" maxWidth="lg">
        <ProfileInitializer>{children}</ProfileInitializer>
      </Container>
    </Box>
  );
}
