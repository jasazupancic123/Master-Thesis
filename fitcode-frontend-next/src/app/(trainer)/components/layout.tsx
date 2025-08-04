import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

import type { ChildrenProps } from '@/common/type/props.type';
import Sidebar from '@/components/sidebar/sidebar';

export default function Layout({ children }: ChildrenProps) {
  return (
    <Container component="main" maxWidth="lg">
      <Sidebar />

      <Box mt={20}>{children}</Box>
    </Container>
  );
}
