import { ChildrenProps } from '@/common/type/props.type';
import AthleteHeader from '@/components/athlete-header/athlete-header';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

export default function Layout({ children }: ChildrenProps) {
  return (
    <Box
      bgcolor="background.default"
      minHeight="100vh"
      padding={0}
      height="100%"
    >
      <AthleteHeader />

      <Container component="main" maxWidth="lg" sx={{ padding: 0 }}>
        <Box>{children}</Box>
      </Container>
    </Box>
  );
}
