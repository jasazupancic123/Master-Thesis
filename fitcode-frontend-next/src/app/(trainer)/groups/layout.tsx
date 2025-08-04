import { Box, Container } from '@mui/material';

import type { ChildrenProps } from '@/common/type/props.type';

export default function Layout({ children }: ChildrenProps) {
  const styles = {
    bgcolor: 'background.default',
    minHeight: `calc(100vh - 64px)`,
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
          mx: 0,
          width: '100%',
        }}
      >
        <Box>{children}</Box>
      </Container>
    </Box>
  );
}
