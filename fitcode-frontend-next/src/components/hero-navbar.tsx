'use client';

import {
  LINK_DASHBOARD,
  LINK_GROUPS,
  LINK_TRAININGS,
  LINK_USERS,
  LINKS_AUTH,
  LINKS_NAVBAR,
} from '@/common/constant/navigation.constant';
import Logo from '@/components/logo';
import { useAuth } from '@/context/auth-provider';
import { UserRole } from '@/controller/user/enum/user-role.enum';
import MenuIcon from '@mui/icons-material/Menu';
import {
  Button,
  Container,
  Divider,
  Drawer,
  MenuItem,
  Select,
  Toolbar,
} from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

export default function HeroNavbar({ showLogin = true }) {
  const { user, logout, role } = useAuth();
  const [open, setOpen] = React.useState(false);
  const toggleDrawer = (newOpen: boolean) => () => setOpen(newOpen);
  const pathname = usePathname();
  const router = useRouter();

  // const mainPageMapper = {
  //   [UserRole.ATHLETE]: LINK_GROUPS,
  //   [UserRole.TRAINER]: LINK_GROUPS,
  //   [UserRole.MANAGER]: LINK_GROUPS,
  //   [UserRole.ADMIN]: LINK_USERS,
  // };

  const mainPageMapper = {
    [UserRole.ATHLETE]: LINK_TRAININGS,
    [UserRole.TRAINER]: LINK_DASHBOARD,
    [UserRole.MANAGER]: LINK_DASHBOARD,
    [UserRole.ADMIN]: LINK_DASHBOARD,
  };

  const handleScrollOrRedirect = (id: string) => async () => {
    if (pathname !== '/') {
      router.push(`/#${id}`);
    } else {
      const section = document.getElementById(id);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    setOpen(false); // Close mobile drawer after selection
  };

  const handleLogoClick = () => {
    if (pathname !== '/') {
      router.push('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
                <Logo width={52} height={35} version="narrow" />
              </Box>
              <Box mr={4} />

              <Box
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  alignItems: 'center',
                }}
              >
                {Object.values(LINKS_NAVBAR).map(({ id, label }) => (
                  <MenuItem
                    key={id}
                    sx={{ py: 0, px: 2 }}
                    onClick={handleScrollOrRedirect(id)}
                  >
                    <Typography variant="body2" color="text.primary">
                      {label}
                    </Typography>
                  </MenuItem>
                ))}
                <MenuItem>
                  <Select
                    variant="standard"
                    displayEmpty
                    value=""
                    onChange={(e) => {
                      router.push(`/model-testing/${e.target.value}`);
                    }}
                    sx={{
                      maxHeight: 40,
                      '&::before': {
                        border: 'none',
                      },
                      '& .MuiSelect-nativeInput': {
                        border: 'none',
                        padding: 0,
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      Test models
                    </MenuItem>
                    <MenuItem value="onnx">onnx</MenuItem>
                    <MenuItem value="tfjs">tfjs</MenuItem>
                    <MenuItem value="mediapipe">mediapipe</MenuItem>
                    <MenuItem value="movenet">movenet</MenuItem>
                  </Select>
                </MenuItem>
              </Box>
            </Box>

            {user && role?.[0] ? (
              <Box
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  gap: 1,
                  alignItems: 'center',
                }}
              >
                <NextLink href={mainPageMapper[role[0]].href} passHref>
                  Training
                </NextLink>
                <NextLink href="#" onClick={logout}>
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
                <MenuIcon />
              </Button>

              <Drawer anchor="right" open={open} onClose={toggleDrawer(false)}>
                <Box
                  sx={{
                    minWidth: '60dvw',
                    p: 2,
                    backgroundColor: 'background.paper',
                    flexGrow: 1,
                  }}
                >
                  {Object.values(LINKS_NAVBAR).map(({ id, label }) => (
                    <MenuItem
                      key={id}
                      sx={{ p: 1 }}
                      onClick={handleScrollOrRedirect(id)}
                    >
                      <Typography variant="body2" color="text.primary">
                        {label}
                      </Typography>
                    </MenuItem>
                  ))}
                  <MenuItem>
                    <Select
                      variant="standard"
                      displayEmpty
                      value=""
                      onChange={(e) => {
                        router.push(`/model-testing/${e.target.value}`);
                      }}
                      sx={{
                        maxHeight: 40,
                        '&::before': {
                          border: 'none',
                        },
                        '& .MuiSelect-nativeInput': {
                          border: 'none',
                          padding: 0,
                        },
                      }}
                    >
                      <MenuItem value="" disabled>
                        Test models
                      </MenuItem>
                      <MenuItem value="onnx">onnx</MenuItem>
                      <MenuItem value="tfjs">tfjs</MenuItem>
                      <MenuItem value="mediapipe">mediapipe</MenuItem>
                      <MenuItem value="movenet">movenet</MenuItem>
                    </Select>
                  </MenuItem>

                  <Divider />

                  <MenuItem>
                    <NextLink href={LINKS_AUTH.login.href}>
                      {LINKS_AUTH.login.label}
                    </NextLink>
                  </MenuItem>
                </Box>
              </Drawer>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </div>
  );
}
