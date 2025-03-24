import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { ChildrenProps } from '@/common/type/props.type';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import { UserController } from '@/controller/user/user.controller';
import { Box, Container } from '@mui/material';
import { cookies } from 'next/headers';

export default async function Layout({ children }: ChildrenProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_COOKIE_NAME)?.value;
  if (!token) return <div>Unauthorized</div>;

  const profile = await UserController.findMe(token);
  if (!profile) return <div>Unauthorized</div>;

  const role = profile.customClaims.role[0];
  const isTrainer = role === UserRole.TRAINER;
  const isManager = role === UserRole.MANAGER;
  const isAdmin = role === UserRole.ADMIN;

  const styles = {
    bgcolor: 'background.default',
    minHeight: `calc(100vh - ${64}px)`,
  };

  if (!isTrainer && !isManager && !isAdmin) return <div>Unauthorized</div>;

  return (
    <Box {...styles}>
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
        <Box mt="48px">{children}</Box>
      </Container>
    </Box>
  );
}
