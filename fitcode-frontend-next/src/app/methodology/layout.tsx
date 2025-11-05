'use client';

import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

import HeroNavbar from '@/components/hero-navbar/hero-navbar';
import { HERO_NAVBAR_HEIGHT } from '@/lib/common/const/state';

export default function Layout({ children }: React.PropsWithChildren) {
  const theme = useTheme();

  return (
    <Box
      width={'100%'}
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{
        backgroundColor: theme.palette.background.default,
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      <Container component="main" maxWidth="lg">
        <Box mt={4}>{children}</Box>
      </Container>
    </Box>
  );
}
