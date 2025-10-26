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
  DASHBOARD_LINK_ID,
  LINKS_AUTH,
  LINKS_AUTHENTICATED_HERO_NAVBAR,
  LINKS_HERO_NAVBAR,
  SIGN_IN_LINK_ID,
  SIGN_OUT_LINK_ID,
} from '@/lib/common/const/nav.const';
import { useAuth } from '@/store/auth.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import Logo from '@/ui/logo';

interface HeroNavbarProps {
  height: string;
  activeSection: string | null;
  dissableLogo?: boolean;
  position?: 'absolute' | 'fixed' | 'relative' | 'static' | 'sticky';
  currentView?: 'contact-us' | 'about-us' | 'home';
}

export default function HeroNavbar(props: HeroNavbarProps) {
  const auth = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const screenSize = useScreenSize();

  const { height, dissableLogo, position, activeSection } = props;

  const [open, setOpen] = useState(false);

  const toggleDrawer = (newOpen: boolean) => () => setOpen(newOpen);

  const handleLogoClick = () => {
    if (pathname !== '/') router.push('/');
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [links, setLinks] = useState(
    Object.values(LINKS_HERO_NAVBAR).concat(
      auth.status === 'authenticated'
        ? Object.values(LINKS_AUTHENTICATED_HERO_NAVBAR[auth.role])
        : Object.values(LINKS_AUTH)
    )
  );

  useEffect(() => {
    setLinks(
      Object.values(LINKS_HERO_NAVBAR).concat(
        auth.status === 'authenticated'
          ? Object.values(LINKS_AUTHENTICATED_HERO_NAVBAR[auth.role])
          : Object.values(LINKS_AUTH)
      )
    );
  }, [auth.status]);

  return (
    <div>
      <AppBar
        elevation={0}
        position={position || 'fixed'}
        sx={{
          height,
          bgcolor: theme.palette.primary.main,
          backgroundImage: 'none',
          textShadow: 'none !important',
        }}
      >
        <Box
          width="100%"
          // maxWidth={1800}
          sx={{
            px: 0,
            mx: 'auto',
          }}
        >
          <Toolbar
            variant="dense"
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pr: 0,
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
                {links.map((item) => {
                  const isActive =
                    activeSection !== null && item.id === activeSection;

                  return (
                    <Box
                      key={item.id}
                      sx={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isActive ? 'center' : undefined,
                        minHeight: 20,
                      }}
                    >
                      {/* Dot */}
                      <Circle
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          transform: `translateY(-50%) ${isActive ? 'scale(1)' : 'scale(0.9)'}`,
                          opacity: isActive ? 1 : 0,
                          transition:
                            'opacity 250ms ease, transform 250ms ease',
                          color: 'text.secondary',
                          mx: 'auto',
                          fontSize: 12,
                          pointerEvents: 'none',
                        }}
                      />

                      {/* Link */}
                      <NextLink
                        href={item.href}
                        passHref
                        onClick={
                          item.id === SIGN_OUT_LINK_ID &&
                          auth.status === 'authenticated'
                            ? () => auth.logout()
                            : undefined
                        }
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          textDecoration: 'none',
                          opacity: isActive ? 0 : 1,
                          transform: isActive ? 'scale(0.98)' : 'scale(1)',
                          transition:
                            'opacity 250ms ease, transform 250ms ease',
                          pointerEvents: isActive ? 'none' : 'auto',
                        }}
                      >
                        <Typography
                          component="span"
                          sx={{
                            lineHeight: 1,
                            fontSize: 14,
                            fontWeight: 600,
                            textTransform: [
                              SIGN_IN_LINK_ID,
                              SIGN_OUT_LINK_ID,
                              DASHBOARD_LINK_ID,
                            ].includes(item.id)
                              ? undefined
                              : 'uppercase',
                            color: 'text.secondary',
                          }}
                        >
                          {item.id === SIGN_IN_LINK_ID ? 'Sign In' : item.label}
                        </Typography>
                      </NextLink>
                    </Box>
                  );
                })}
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
                      backgroundColor: theme.palette.primary.main,
                    }}
                  >
                    <Box
                      sx={{
                        flexGrow: 1,
                      }}
                    >
                      {links.map((item) => (
                        <MenuItem
                          key={item.id}
                          sx={{ p: 1, zIndex: 1000 }}
                          onClick={() => {
                            if (
                              item.id === SIGN_OUT_LINK_ID &&
                              auth.status === 'authenticated'
                            )
                              auth.logout();
                            router.push(item.href);
                            setOpen(false);
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            fontWeight={500}
                          >
                            {item.id === SIGN_IN_LINK_ID
                              ? 'Sign In'
                              : item.label}
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
