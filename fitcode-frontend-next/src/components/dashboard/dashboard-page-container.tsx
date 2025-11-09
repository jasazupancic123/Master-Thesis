import { Box, SxProps } from '@mui/material';
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
      sx={{ py: 1, ...sx }}
      gap={2}
    >
      {children}
    </Box>
  );
}
