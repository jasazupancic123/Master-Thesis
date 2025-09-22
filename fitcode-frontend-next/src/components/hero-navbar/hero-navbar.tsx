'use client';

import MenuIcon from '@mui/icons-material/Menu';
import { Button, Container, Drawer, MenuItem, Toolbar } from '@mui/material';
import { useTheme } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import {
  LINK_DASHBOARD,
  LINK_TRAININGS,
  LINKS_AUTH,
} from '@/common/constant/navigation.constant';
import Logo from '@/components/logo/logo';
import { UserRole } from '@/controller/profile/enum/user-role.enum';
import { useAuth } from '@/store/auth.provider';

export default function HeroNavbar({ showLogin = true }) {
  const auth = useAuth();
  const [open, setOpen] = React.useState(false);
  const toggleDrawer = (newOpen: boolean) => () => setOpen(newOpen);
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();

  const mainPageMapper = {
    [UserRole.ATHLETE]: LINK_TRAININGS,
    [UserRole.TRAINER]: LINK_DASHBOARD,
    [UserRole.MANAGER]: LINK_DASHBOARD,
    [UserRole.ADMIN]: LINK_DASHBOARD,
  };

  const handleLogoClick = () => {
    if (pathname !== '/') router.push('/');
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <AppBar
        position="fixed"
        sx={{ bgcolor: '#121212', backgroundImage: 'none' }}
      >
        <Container maxWidth="lg">
          <Toolbar
            variant="regular"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: '64px',
            }}
          >
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              {/* Logo Click Handler */}
              <Box onClick={handleLogoClick} sx={{ cursor: 'pointer' }}>
                <Logo width={100} />
              </Box>
              <Box mr={4} />
            </Box>

            {auth.status === 'authenticated' ? (
              <Box
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  gap: 1,
                  alignItems: 'center',
                }}
              >
                <NextLink href={mainPageMapper[auth.role].href} passHref>
                  Dashboard
                </NextLink>

                <NextLink href="#" onClick={() => auth.logout()}>
                  Sign Out
                </NextLink>
              </Box>
            ) : showLogin ? (
              <Box
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  gap: 1,
                  alignItems: 'center',
                }}
              >
                <NextLink href={LINKS_AUTH.login.href} passHref>
                  {LINKS_AUTH.login.label}
                </NextLink>
              </Box>
            ) : null}

            <Box sx={{ display: { md: 'none' } }}>
              <Button
                variant="text"
                color="secondary"
                onClick={toggleDrawer(true)}
              >
                <MenuIcon sx={{ color: theme.palette.text.primary }} />
              </Button>

              <Drawer anchor="right" open={open} onClose={toggleDrawer(false)}>
                <Box
                  sx={{
                    minWidth: '10dvw',
                    p: 2,
                    flexGrow: 1,
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: 'background.paper',
                      flexGrow: 1,
                    }}
                  >
                    {Object.values(LINKS_AUTH).map((item) => (
                      <MenuItem
                        key={item.id}
                        sx={{ p: 1, zIndex: 1000 }}
                        onClick={() => {
                          router.push(item.href);
                        }}
                      >
                        <Typography variant="body2" color="text.primary">
                          {item.label}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Box>
                </Box>
              </Drawer>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </div>
  );
}
