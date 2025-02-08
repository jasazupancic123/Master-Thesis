'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Link from 'next/link';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Logo from '@/components/logo';
import MenuIcon from '@mui/icons-material/Menu';
import { Tooltip } from '@mui/material';
import { useAuth } from '@/context/auth-provider';
import Typography from '@mui/material/Typography';
import { CommonService } from '@/common/service/common.service';
import { AuthContextType } from '@/common/type/context.type';

export interface Props {
  title?: string;
}

const commonService = CommonService.instance;

export default function Sidebar({ title }: Props) {
  const [open, setOpen] = React.useState(false);
  const { role, logout } = useAuth() as AuthContextType;
  const toggle = (newOpen: boolean) => () => setOpen(newOpen);

  const DrawerList = role.length && (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggle(false)}>
      <List>
        {commonService.navigation
          .getSidebarLinksByUserRole(role[0])
          .map(({ href, label }, i) => (
            <ListItem key={i} disablePadding>
              <ListItemButton>
                <Link href={href} passHref>
                  <ListItemText primary={label} />
                </Link>
              </ListItemButton>
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
      <Container maxWidth="lg" sx={{ bgcolor: 'background.default' }}>
        <Toolbar
          variant="regular"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '64px',
          }}
        >
          <Logo width={80} height={40} />
        </Toolbar>
      </Container>

      {title && (
        <Box
          display="flex"
          justifyContent="center"
          pb={3}
          bgcolor="background.paper"
        >
          <Box bgcolor="background.default" borderRadius="0 0 50px 50px">
            <Typography variant="h5" component="h1" py={1} px={8}>
              {title}
            </Typography>
          </Box>
        </Box>
      )}

      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '64px',
          width: '64px',
        }}
        onClick={toggle(true)}
      >
        <Box
          sx={{
            height: '100%',
            bgcolor: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Tooltip title="Menu">
            <MenuIcon />
          </Tooltip>
        </Box>
      </Box>

      <Drawer open={open} onClose={toggle(false)}>
        {DrawerList}
      </Drawer>
    </AppBar>
  );
}
