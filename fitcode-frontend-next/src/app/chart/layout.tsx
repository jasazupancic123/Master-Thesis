import { ChildrenProps } from '@/common/type/props.type';
import SidebarAthlete from '@/components/sidebar-athlete/sidebar-athlete';
import ChartInitializer from '@/initializers/chart.initializer';
import { AthleteProvider } from '@/store/athlete-provider';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

export default function Layout({ children }: ChildrenProps) {
  return (
    <Box bgcolor="background.paper" minHeight="100vh" padding={0} height="100%">
      <AthleteProvider>
        <SidebarAthlete />

        <Container component="main" maxWidth="lg" sx={{ padding: 0 }}>
          <Box>
            <ChartInitializer>{children}</ChartInitializer>
          </Box>
        </Container>
      </AthleteProvider>
    </Box>
  );
}
