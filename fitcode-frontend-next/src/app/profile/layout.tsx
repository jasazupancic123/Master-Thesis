import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import SidebarAthlete from '@/components/sidebar-athlete/sidebar-athlete';
import { ChildrenProps } from '@/common/type/props.type';
import { AthleteProvider } from '@/store/athlete-provider';
import ProfileInitializer from '@/initializers/profile.initializer';
import Alert from '@/components/alert/alert';
import { UserController } from '@/controller/user/user.controller';
import { cookies } from 'next/headers';
import { FIREBASE_COOKIE_NAME } from '@/common/constant/browser.constant';
import { isAthlete } from '@/common/service/util/firebase-auth.util';

export default async function Layout({ children }: ChildrenProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(FIREBASE_COOKIE_NAME)?.value;
  if (!token) return <Alert type="unauthorized" />;

  const profile = await UserController.findMe(token);
  if (!profile) return <Alert type="unauthorized" />;

  const roles = profile.customClaims.role;

  return (
    <Box bgcolor="background.paper" minHeight="100vh">
      <AthleteProvider>
        {isAthlete(roles) && <SidebarAthlete />}

        <Container component="main" maxWidth="lg">
          <Box mt={isAthlete(roles) ? '10px' : undefined}>
            <ProfileInitializer>{children}</ProfileInitializer>
          </Box>
        </Container>
      </AthleteProvider>
    </Box>
  );
}
