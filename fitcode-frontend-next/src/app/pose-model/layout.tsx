import { Box, Container } from '@mui/material';

import type { ChildrenProps } from '@/common/type/props.type';

export default function Layout({ children }: ChildrenProps) {
  return (
    <Box bgcolor="background.default">
      <Container component="main" maxWidth="lg" sx={{ p: 0 }}>
        {children}
      </Container>
    </Box>
  );
}
