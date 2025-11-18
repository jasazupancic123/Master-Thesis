import type { SxProps } from '@mui/material';
import { Box } from '@mui/material';
import React from 'react';

type Props = React.PropsWithChildren<{
  sx?: SxProps;
}>;

export default function DashboardPageContainer(props: Props) {
  const { children, sx } = props;

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{ py: 1, ...sx, pb: 6 }}
      gap={2}
    >
      {children}
    </Box>
  );
}
