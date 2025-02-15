import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import SidebarAthlete from '@/components/sidebar-athlete';
import { ChildrenProps } from '@/common/type/props.type';

export default function Layout({ children }: ChildrenProps) {
  return (
    <Box bgcolor="background.paper" minHeight="100vh">
      <SidebarAthlete />

      <Container component="main" maxWidth="lg">
        <Box>{children}</Box>
      </Container>
    </Box>
  );
}
