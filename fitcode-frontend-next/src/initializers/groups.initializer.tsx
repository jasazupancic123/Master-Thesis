'use client';

import { useEffect, useState } from 'react';
import { ApiUtil } from '@/common/service/util/api.util';
import { UserController } from '@/controller/user/user.controller';
import Loading from '../components/loading/loading';
import { ChildrenProps } from '@/common/type/props.type';
import { Box, Container } from '@mui/material';
import SidebarAthlete from '@/components/sidebar-athlete/sidebar-athlete';
import { UserRole } from '@/controller/user/enum/user-role.enum';

export default function GroupsInitializer({ children }: ChildrenProps) {
  const [state, setState] = useState<{
    role?: UserRole[];
    unauthorized?: boolean;
  } | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const profile = await UserController.findMe();

        setState({
          role: profile.customClaims.role,
        });
      } catch (e) {
        setState({ unauthorized: true });
      }
    }

    init();
  }, []);

  if (!state) return <Loading text="Loading..." />;
  if (state.unauthorized) return <Loading text="Unauthorized" />;

  const isAthlete = state.role?.includes(UserRole.ATHLETE);
  const isTrainer =
    state.role?.includes(UserRole.TRAINER) ||
    state.role?.includes(UserRole.MANAGER);

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
        disableGutters
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 0,
          pb: 2,
          mx: 0,
          width: '100%',
        }}
      >
        <Box>{children}</Box>
      </Container>
    </Box>
  );
}
