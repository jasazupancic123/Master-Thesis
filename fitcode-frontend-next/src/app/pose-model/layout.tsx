import { ChildrenProps } from '@/common/type/props.type';
import { Box, Container } from '@mui/material';

export default function Layout({ children }: ChildrenProps) {
  return (
    <Box bgcolor="background.default">
      <Container component="main" maxWidth="lg" sx={{ p: 0 }}>
        {children}
      </Container>
    </Box>
  );
}
