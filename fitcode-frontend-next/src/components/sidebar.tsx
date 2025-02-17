'use client';

import { CommonService } from '@/common/service/common.service';
import { AuthContextType } from '@/common/type/context.type';
import { useAuth } from '@/context/auth-provider';
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

const commonService = CommonService.instance;

export default function Sidebar() {
  const [open, setOpen] = React.useState(false);
  const { role, logout } = useAuth() as AuthContextType;
  const toggle = (newOpen: boolean) => () => setOpen(newOpen);

  const DrawerList = role.length && (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggle(false)}>
      <List sx={{ pt: 0 }}>
        <ListItem>
          {/* This provides the gap from the top of the screen */}
          <ListItemButton>
            <ListItemText />
          </ListItemButton>
        </ListItem>
        {commonService.navigation
          .getSidebarLinksByUserRole(role[0])
          .map(({ href, label }, i) => (
            <ListItem key={i} disablePadding>
              <Link href={href} passHref style={{ width: '100%' }}>
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
            <ListItemText primary="Sign Out" onClick={logout} />
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
            top: 0,
            left: 0,
            height: '50px',
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

      <Drawer open={open} onClose={toggle(false)}>
        {DrawerList}
      </Drawer>
    </AppBar>
  );
}
