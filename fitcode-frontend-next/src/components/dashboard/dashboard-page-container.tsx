import type { SxProps } from '@mui/material';
import { Box } from '@mui/material';
import React from 'react';

import { MAX_WIDTH_DASHBOARD_ITEM } from '../trainer-group-day-view/constant/dimensions.constant';
import { useTrainings } from '@/store/trainings.provider';

type Props = React.PropsWithChildren<{
  sx?: SxProps;
}>;

export default function DashboardPageContainer(props: Props) {
  const trainingsContext = useTrainings();

  const { children, sx } = props;

  return (
    <Box
      width="100%"
      maxWidth={MAX_WIDTH_DASHBOARD_ITEM}
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{ py: trainingsContext ? 0 : 1, ...sx, pb: 6, overflowX: 'hidden' }}
      gap={2}
    >
      {children}
    </Box>
  );
}
