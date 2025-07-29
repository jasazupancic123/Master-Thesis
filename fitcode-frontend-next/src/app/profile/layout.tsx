import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import { ChildrenProps } from '@/common/type/props.type';
import ProfileInitializer from '@/initializers/profile.initializer';

export default function Layout({ children }: ChildrenProps) {
  return (
    <Box bgcolor="background.default" minHeight="100vh">
      <Container component="main" maxWidth="lg">
        <ProfileInitializer>{children}</ProfileInitializer>
      </Container>
    </Box>
  );
}
