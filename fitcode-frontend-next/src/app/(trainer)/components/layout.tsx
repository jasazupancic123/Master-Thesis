import Container from '@mui/material/Container';
import Sidebar from '@/components/sidebar/sidebar';
import Box from '@mui/material/Box';
import { ChildrenProps } from '@/common/type/props.type';

export default function Layout({ children }: ChildrenProps) {
  return (
    <Container component="main" maxWidth="lg">
      <Sidebar />

      <Box mt={20}>{children}</Box>
    </Container>
  );
}
