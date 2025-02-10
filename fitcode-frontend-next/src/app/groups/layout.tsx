import React, { ReactNode } from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import SidebarAthlete from '@/components/sidebar-athlete';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { UserController } from '@/controller/user/user.controller';
import { cookies } from 'next/headers';

interface Props {
  children: ReactNode;
}

export default async function Layout({ children }: Props) {
  // fetch data
  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_COOKIE_NAME)?.value;
  if (!token) return <div>Unauthorized</div>;

  const profile = await UserController.findMe(token);
  if (!profile) return <div>Unauthorized</div>;

  const role = profile.customClaims.role[0];
  const isAthlete = role === UserRole.ATHLETE;
  const isTrainer = role === UserRole.TRAINER;

  const styles = {
    bgcolor: isTrainer ? 'background.default' : 'background.paper',
    minHeight: `calc(100vh - ${isTrainer ? 64 : 0}px)`,
  };

  return (
    <Box {...styles}>
      {isAthlete && <SidebarAthlete />}

      <Container
        component="main"
        maxWidth={false}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 0,
          pb: 2,
          mx: 0,
          width: '100%',
        }}
      >
        <Box mt="49px">{children}</Box>
      </Container>
    </Box>
  );
}
