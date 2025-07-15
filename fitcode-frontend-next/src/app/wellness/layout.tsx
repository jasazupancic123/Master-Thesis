import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import SidebarAthlete from '@/components/sidebar-athlete/sidebar-athlete';
import { ChildrenProps } from '@/common/type/props.type';
import { AthleteProvider } from '@/store/athlete-provider';
import WellnessInitializer from '@/initializers/wellness.initializer';

export default function Layout({ children }: ChildrenProps) {
  return (
    <Box bgcolor="background.paper" minHeight="100vh">
      <AthleteProvider>
        <SidebarAthlete />

        <Container component="main" maxWidth="lg" sx={{ px: '0px !important' }}>
          <Box>
            <WellnessInitializer> {children}</WellnessInitializer>
          </Box>
        </Container>
      </AthleteProvider>
    </Box>
  );
}
