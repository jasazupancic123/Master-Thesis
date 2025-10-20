'use client';

import MenuIcon from '@mui/icons-material/Menu';
import { Tooltip } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Link from 'next/link';
import * as React from 'react';

import { LINKS_SIDEBAR_GROUP_VIEW } from '@/lib/common/const/nav.const';
import { UserRole } from '@/core/profile/enum/user-role.enum';
import { lib } from '@/lib';
import { useAthlete } from '@/store/athlete.provider';
import { useAuthenticatedAuth } from '@/store/auth.provider';

export default function AthleteSidebar() {
  const athleteContext = useAthlete();
  const { role, logout } = useAuthenticatedAuth();

  const { filter, setFilter } = athleteContext || {};

  const [open, setOpen] = React.useState(false);

  const toggle = (newOpen: boolean) => () => setOpen(newOpen);

  const DrawerList = role && (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggle(false)}>
      <List sx={{ pt: 0 }}>
        <ListItem>
          {/* This provides the gap from the top of the screen */}
          <ListItemButton>
            <ListItemText />
          </ListItemButton>
        </ListItem>

        {lib.common.nav
          .getSidebarLinksByUserRole(role)
          .map(({ href, label }, i) => (
            <ListItem key={i} disablePadding>
              <Link
                href={href}
                passHref
                style={{ width: '100%' }}
                onClick={() => {
                  if (!filter || !setFilter) return;

                  const newValue = Object.values(
                    LINKS_SIDEBAR_GROUP_VIEW[UserRole.ATHLETE]
                  )[i];
                  if (!newValue) return;

                  setFilter(newValue);
                }}
              >
                <ListItemButton sx={{ width: '100%' }}>
                  <ListItemText primary={label} />
                </ListItemButton>
              </Link>
            </ListItem>
          ))}
      </List>

      <Divider />

      <List>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemText primary="Sign Out" onClick={() => logout()} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <AppBar
      position="fixed"
      sx={{
        boxShadow: 0,
        bgcolor: 'background.default',
        backgroundImage: 'none',
        mt: 0,
        width: '100%',
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          bgcolor: 'background.default',
        }}
      >
        <Box
          sx={{
            position: 'fixed',
            top: -1,
            right: 0,
            height: '60px',
            width: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          onClick={toggle(!open)}
        >
          <Tooltip title="Menu">
            <MenuIcon sx={{ mr: 1 }} />
          </Tooltip>
        </Box>
      </Container>

      <Drawer open={open} onClose={toggle(false)} anchor="right">
        {DrawerList}
      </Drawer>
    </AppBar>
  );
}
