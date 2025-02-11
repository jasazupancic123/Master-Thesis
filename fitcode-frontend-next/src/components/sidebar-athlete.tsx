'use client';

import { LINKS_SIDEBAR } from '@/common/constant/navigation.constant';
import Box from '@mui/material/Box';
import * as React from 'react';
import { useState } from 'react';
import Logo from '@/components/logo';
import { usePathname } from 'next/navigation';
import Stack from '@mui/material/Stack';
import { useScreenSize } from '@/context/screen-size-provider';
import Sidebar from './sidebar';
import BottomNavigation from './bottom-navigation';
import { UserRole } from '@/controller/user/enum/user-role.enum';

interface Props {
  title?: string;
}

export default function SidebarAthlete(props: Props) {
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
        <Logo width={120} height={35} />
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
