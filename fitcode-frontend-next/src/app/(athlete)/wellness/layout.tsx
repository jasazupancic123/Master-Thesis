import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

import type { ChildrenProps } from '@/common/type/props.type';
import AthleteHeader from '@/components/athlete-header/athlete-header';
import WellnessInitializer from '@/initializers/wellness.initializer';

export default function Layout({ children }: ChildrenProps) {
  return (
    <Box bgcolor="background.paper" minHeight="100vh">
      <AthleteHeader />

      <Container component="main" maxWidth="lg" sx={{ px: '0px !important' }}>
        <Box>
          <WellnessInitializer> {children}</WellnessInitializer>
        </Box>
      </Container>
    </Box>
  );
}
