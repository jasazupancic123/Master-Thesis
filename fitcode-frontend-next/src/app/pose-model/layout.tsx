import { Box, Container } from '@mui/material';

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <Box bgcolor="background.default">
      <Container sx={{ p: 0, maxWidth: '100vw', maxHeight: '100vh' }}>
        {children}
      </Container>
    </Box>
  );
}
