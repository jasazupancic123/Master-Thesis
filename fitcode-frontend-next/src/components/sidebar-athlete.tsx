'use client';

import { LINKS_SIDEBAR } from '@/common/constant/navigation.constant';
import Logo from '@/components/logo';
import { useScreenSize } from '@/context/screen-size-provider';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { useState } from 'react';
import BottomNavigation from './bottom-navigation';
import Sidebar from './sidebar';

export default function SidebarAthlete() {
  const screenSize = useScreenSize();
  const path = usePathname();
  const mapper = Object.values(LINKS_SIDEBAR[UserRole.ATHLETE]).map(
    (link) => link.href
  );

  const [index, setIndex] = useState(() => {
    const index = mapper.findIndex((href) => path === href);
    return index === -1 ? 0 : index;
  });

  return (
    <>
      <Stack
        direction="row"
        spacing={2}
        bgcolor="background.default"
        width="100%"
        height={screenSize.isLandscapeMobile || screenSize.isMobile ? 50 : 64}
        justifyContent="center"
        alignItems="center"
      >
        <Logo width={52} height={35} version="narrow" />
      </Stack>

      <Box
        position="fixed"
        bottom={0}
        width="100%"
        display="flex"
        justifyContent="center"
        zIndex={10001}
      >
        {screenSize.isLandscapeMobile || screenSize.isMobile ? (
          <Sidebar />
        ) : (
          <BottomNavigation index={index} setIndex={setIndex} mapper={mapper} />
        )}
      </Box>
    </>
  );
}
