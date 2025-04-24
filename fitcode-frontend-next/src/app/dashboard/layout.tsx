import { ChildrenProps } from '@/common/type/props.type';
import { Box, Container } from '@mui/material';

export default async function Layout({ children }: ChildrenProps) {
  const styles = {
    bgcolor: 'background.default',
    minHeight: `calc(100vh - ${64}px)`,
  };

  return (
    <Box {...styles}>
      <Container
        component="main"
        maxWidth={false}
        disableGutters
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 0,
          px: 2,
          pb: 2,
          mx: 0,
          width: '100%',
        }}
      >
        <Box mt="48px">{children}</Box>
      </Container>
    </Box>
  );
}
