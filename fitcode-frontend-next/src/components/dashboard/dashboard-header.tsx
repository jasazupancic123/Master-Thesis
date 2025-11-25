'use client';

import { Box } from '@mui/material';

import { useScreenSize } from '@/store/screen-size.provider';

export default function DashboardHeader() {
  const screenSize = useScreenSize();

  const isMobileSidebar = screenSize.isMobile || screenSize.isTablet;

  return <Box width="100vw" height={isMobileSidebar ? 40 : 0}></Box>;
}
