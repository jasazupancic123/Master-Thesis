import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { ChildrenProps } from '@/common/type/props.type';
import SidebarAthlete from '@/components/sidebar-athlete';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { UserController } from '@/controller/user/user.controller';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { cookies } from 'next/headers';

export default async function Layout({ children }: ChildrenProps) {
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
        <Box mt="49px">{children}</Box>
      </Container>
    </Box>
  );
}
