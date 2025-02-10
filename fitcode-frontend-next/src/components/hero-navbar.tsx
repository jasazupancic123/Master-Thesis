'use client';

import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import {
  LINK_GROUPS,
  LINK_USERS,
  LINKS_AUTH,
  LINKS_NAVBAR,
} from '@/common/constant/navigation.constant';
import NextLink from 'next/link';
import { Divider, Drawer } from '@mui/material';
import Logo from '@/components/logo';
import { useAuth } from '@/context/auth-provider';
import { UserRole } from '@/controller/user/enum/user-role.enum';

export default function HeroNavbar({ showLogin = true }) {
  const { user, logout, role } = useAuth();
  const [open, setOpen] = React.useState(false);
  const toggleDrawer = (newOpen: boolean) => () => setOpen(newOpen);

  const mainPageMapper = {
    [UserRole.ATHLETE]: LINK_GROUPS,
    [UserRole.TRAINER]: LINK_GROUPS,
    [UserRole.MANAGER]: LINK_GROUPS,
    [UserRole.ADMIN]: LINK_USERS,
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
              <Logo width={120} height={40} />
              <Box mr={4} />

              <Box
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  alignItems: 'center',
                }}
              >
                {Object.values(LINKS_NAVBAR).map(({ id, label }) => (
                  <MenuItem key={id} sx={{ py: 0, px: 2 }}>
                    <NextLink href={`/public#${id}`} passHref>
                      <Typography variant="body2" color="text.primary">
                        {label}
                      </Typography>
                    </NextLink>
                  </MenuItem>
                ))}
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
                    <MenuItem key={id} sx={{ p: 1 }}>
                      <NextLink href={`/public#${id}`} passHref>
                        <Typography variant="body2" color="text.primary">
                          {label}
                        </Typography>
                      </NextLink>
                    </MenuItem>
                  ))}

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
