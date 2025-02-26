import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import SidebarAthlete from '@/components/sidebar-athlete';
import { ChildrenProps } from '@/common/type/props.type';
import { AthleteProvider } from '@/context/athlete-provider';

export default function Layout({ children }: ChildrenProps) {
  return (
    <Box bgcolor="rgb(47,62,72)" minHeight="100vh">
      <AthleteProvider>
        <SidebarAthlete />

        <Container component="main" sx={{ px: '0px !important' }}>
          <Box>{children}</Box>
        </Container>
      </AthleteProvider>
    </Box>
  );
}
