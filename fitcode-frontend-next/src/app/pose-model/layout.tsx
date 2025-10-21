import { Box, Container } from '@mui/material';

import type { ChildrenProps } from '@/common/type/props.type';

export default function Layout({ children }: ChildrenProps) {
  return (
    <Box bgcolor="background.default">
      <Container sx={{ p: 0, maxWidth: '100vw', maxHeight: '100vh' }}>
        {children}
      </Container>
    </Box>
  );
}
