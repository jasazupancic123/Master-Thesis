import {
  Groups,
  Logout,
  Menu as MenuIcon,
  Settings,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';

import SelectInputHorizontal from '../select-input-horizontal/select-input-horizontal';
import {
  LINK_DASHBOARD,
  LINK_PROFILE,
  LINK_SETTINGS,
  LINKS_DASHBOARD_SIDEBAR_SUB_ITEMS,
  LINKS_SIDEBAR,
} from '@/common/constant/navigation.constant';
import { isAdmin } from '@/common/firebase/firebase-auth.util';
import type { Institution } from '@/controller/institution/type/institution.type';
import { useAuth } from '@/store/auth-provider';
import { useDashboard } from '@/store/dashboard-provider';
import { useScreenSize } from '@/store/screen-size-provider';

export default function DashboardMenuMobile() {
  const { institutions, selectedInstitution, setSelectedInstitution } =
    useDashboard();
  const { role, profile, logout } = useAuth();

  const screenSize = useScreenSize();

  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 4,
          left: 5,
          zIndex: 1300,
        }}
      >
        <IconButton
          onClick={() => setOpen(!open)}
          edge="end"
          color="inherit"
          aria-label="menu"
        >
          <MenuIcon />
        </IconButton>
      </div>

      {/* Side drawer from the right */}
      <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
        <List sx={{ mt: 5 }}>
          {isAdmin(role!) && (
            <Box ml={screenSize.isMobile ? 2 : 0}>
              <SelectInputHorizontal<Institution>
                label={selectedInstitution?.name || 'Select institution'}
                icon={<Groups />}
                value={selectedInstitution?.id || ''}
                items={institutions || []}
                itemKey="id"
                itemName="name"
                setValue={(institutionId) => {
                  const institution = institutions?.find(
                    (i) => i.id === institutionId
                  );
                  if (institution) setSelectedInstitution(institution);
                }}
              />
            </Box>
          )}

          {role &&
            [
              ...Object.values(LINKS_SIDEBAR[role]),
              ...Object.values(LINKS_DASHBOARD_SIDEBAR_SUB_ITEMS),
            ].map((link, i) => {
              if (!link) return null;

              let Icon: React.ReactNode = null;

              switch (link.href) {
                case LINK_DASHBOARD.href:
                  Icon = (
                    <Avatar
                      src={selectedInstitution?.imageUrl || ''}
                      sx={{
                        width: 25,
                        height: 25,
                      }}
                    />
                  );
                  break;
                case LINK_PROFILE.href:
                  Icon = (
                    <Avatar
                      src={profile?.profileImageUrl}
                      sx={{
                        width: 25,
                        height: 25,
                      }}
                    />
                  );
                  break;
                case LINK_SETTINGS.href:
                  Icon = <Settings sx={{ fontSize: 25 }} />;
                  break;
                case LINKS_DASHBOARD_SIDEBAR_SUB_ITEMS.signout.href:
                  Icon = <Logout sx={{ fontSize: 25 }} />;
                  break;
                default:
                  Icon = undefined;
              }

              return (
                <Tooltip title={link.label} placement="right" key={i}>
                  <ListItem disablePadding>
                    <Link href={link.href} passHref>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="flex-start"
                        ml={1}
                        onClick={() => {
                          if (
                            link.href ===
                            LINKS_DASHBOARD_SIDEBAR_SUB_ITEMS.signout.href
                          )
                            logout();
                        }}
                      >
                        {Icon}
                        <ListItemText
                          primary={link.label}
                          sx={{
                            px: ![
                              LINK_DASHBOARD.href,
                              LINK_PROFILE.href,
                              LINK_SETTINGS.href,
                              LINKS_DASHBOARD_SIDEBAR_SUB_ITEMS.signout.href,
                            ].includes(link.href)
                              ? 1
                              : 2,
                            py: 1,
                          }}
                        />
                      </Box>
                    </Link>
                  </ListItem>
                </Tooltip>
              );
            })}
        </List>
      </Drawer>
    </>
  );
}
