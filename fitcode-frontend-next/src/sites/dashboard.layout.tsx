import { ChildrenProps } from '@/common/type/props.type';
import DashboardSidebar from '@/components/dashboard-sidebar/dashboard-sidebar';
import { Box, Container } from '@mui/material';

export default function DashboardLayout({ children }: ChildrenProps) {
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
        <Box mt="48px">
          <Box mt="10px" display="flex" flexDirection="row" width="100%">
            <DashboardSidebar />
            <Box
              sx={{
                flex: 1,
                overflow: 'hidden',
              }}
            >
              {children}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
