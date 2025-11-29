import { Box, Container } from '@mui/material';

export default function Layout({ children }: React.PropsWithChildren) {
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
