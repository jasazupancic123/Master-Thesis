'use client';

import { Circle } from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';
import { Button, Drawer, MenuItem, Toolbar } from '@mui/material';
import { useTheme } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  LINKS_AUTH,
  LINKS_AUTHENTICATED_HERO_NAVBAR,
  LINKS_HERO_NAVBAR,
  SIGN_IN_LINK_ID,
  SIGN_OUT_LINK_ID,
} from '@/common/constant/navigation.constant';
import Logo from '@/components/logo/logo';
import { useAuth } from '@/store/auth.provider';
import { useScreenSize } from '@/store/screen-size.provider';

interface HeroNavbarProps {
  height: string;
  dissableLogo?: boolean;
}

export default function HeroNavbar(props: HeroNavbarProps) {
  const auth = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const screenSize = useScreenSize();

  const { height, dissableLogo } = props;

  const [open, setOpen] = useState(false);

  const toggleDrawer = (newOpen: boolean) => () => setOpen(newOpen);

  const handleLogoClick = () => {
    if (pathname !== '/') router.push('/');
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [links, setLinks] = useState(
    Object.values(LINKS_HERO_NAVBAR).concat(
      auth.status === 'authenticated'
        ? Object.values(LINKS_AUTHENTICATED_HERO_NAVBAR)
        : Object.values(LINKS_AUTH)
    )
  );

  useEffect(() => {
    setLinks(
      Object.values(LINKS_HERO_NAVBAR).concat(
        auth.status === 'authenticated'
          ? Object.values(LINKS_AUTHENTICATED_HERO_NAVBAR)
          : Object.values(LINKS_AUTH)
      )
    );
  }, [auth.status]);

  return (
    <div>
      <AppBar
        elevation={0}
        position="fixed"
        sx={{
          height,
          bgcolor: theme.palette.primary.main,
          backgroundImage: 'none',
          textShadow: 'none !important',
        }}
      >
        <Box
          width="100%"
          maxWidth={1800}
          sx={{
            px: 0,
            mx: 'auto',
          }}
        >
          <Toolbar
            variant="dense"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              {/* Logo Click Handler */}
              {!dissableLogo && (
                <Box
                  onClick={handleLogoClick}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Logo width={130} version="dark" />
                </Box>
              )}

              <Box mr={4} />
            </Box>

            {!screenSize.isTablet && !screenSize.isMobile ? (
              <Box height={height} display="flex" alignItems="center" gap={3}>
                <Circle sx={{ color: 'text.secondary', fontSize: 12 }} />

                {links.map((item) => (
                  <NextLink
                    key={item.id}
                    href={item.href}
                    passHref
                    onClick={
                      item.id === SIGN_OUT_LINK_ID &&
                      auth.status === 'authenticated'
                        ? () => auth.logout()
                        : undefined
                    }
                  >
                    <Typography
                      component="span"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        lineHeight: 1,
                        fontSize: 14,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: 'text.secondary',
                        textDecoration: 'none',
                      }}
                    >
                      {item.id === SIGN_IN_LINK_ID ? 'Sign In' : item.label}
                    </Typography>
                  </NextLink>
                ))}
              </Box>
            ) : (
              <>
                <Button
                  variant="text"
                  color="secondary"
                  onClick={toggleDrawer(true)}
                >
                  <MenuIcon sx={{ color: theme.palette.text.secondary }} />
                </Button>{' '}
                <Drawer
                  anchor="right"
                  open={open}
                  onClose={toggleDrawer(false)}
                >
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
                      {links.map((item) => (
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
              </>
            )}
          </Toolbar>
        </Box>
      </AppBar>
    </div>
  );
}
