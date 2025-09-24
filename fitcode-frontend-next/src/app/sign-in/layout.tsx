import { Box } from '@mui/material';

import type { ChildrenProps } from '@/common/type/props.type';

export default function Layout({ children }: ChildrenProps) {
  return (
    <Box
      width="100%"
      height="100vh"
      sx={{
        backgroundColor: 'primary.main',
      }}
    >
      <Box
        width="100%"
        maxWidth={1800}
        sx={{
          px: 0,
          mx: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
