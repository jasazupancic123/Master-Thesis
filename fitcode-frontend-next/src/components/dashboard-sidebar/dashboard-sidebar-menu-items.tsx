import { KeyboardArrowDown } from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import { useRef, useState } from 'react';

import DashboardPlanningModal from '../dashboard/modals/dashboard-planning-modal';
import { theme } from '@/app/style';
import { lib } from '@/lib';
import {
  DASHBOARD_PLANNING_ID,
  DASHBOARD_VIEWS,
  INSTITUTION_PAGE_ID,
} from '@/lib/common/const/nav.const';
import type { ILink } from '@/lib/common/type/link.type';
import type { SetState } from '@/lib/common/type/state.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';

interface Props {
  setDrawerOpen?: SetState<boolean>;
}

export default function DashboardSidebarMenuItems(props: Props) {
  const { role } = useAuthenticatedAuth();

  const { institutions, groups } = useMain();

  const {
    filter,
    setFilter,
    selectedInstitution,
    setSelectedInstitution,
    setSelectedGroups,
  } = useDashboard();

  const { setDrawerOpen } = props;

  const [openMenu, setOpenMenu] = useState(false);
  const [openPlanningModal, setOpenPlanningModal] = useState(false);

  const anchorElRef = useRef<HTMLDivElement | null>(null);

  if (!selectedInstitution) return null;

  const dashboardItems: ILink[] = DASHBOARD_VIEWS(role!).concat(
    lib.firebase.auth.isManager(role) || lib.firebase.auth.isAdmin(role)
      ? [
          {
            id: INSTITUTION_PAGE_ID,
            href: '',
            label: selectedInstitution.name,
            icon: (
              <Image
                src={selectedInstitution.imageUrl}
                alt="Institution"
                unoptimized={lib.common.env.unoptimizeImages()}
                width={19}
                height={0}
                layout="intrinsic"
                style={{ objectFit: 'cover' }}
              />
            ),
          },
        ]
      : []
  );

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      gap={1}
      mt={4}
      sx={{
        cursor: 'pointer',
      }}
    >
      {dashboardItems.map((item) => {
        if (!item) return null;

        const isSelected = item.id === filter?.id;

        return (
          <Box key={item.id} width="100%" display="flex" flexDirection="column">
            {item.id === INSTITUTION_PAGE_ID ||
              (item.id === DASHBOARD_PLANNING_ID && (
                <Divider
                  sx={{
                    width: '100%',
                    borderColor: theme.palette.divider,
                    mb: 1,
                  }}
                />
              ))}
            <Box
              ref={item.id === INSTITUTION_PAGE_ID ? anchorElRef : null}
              width="100%"
              display="flex"
              justifyContent="flex-start"
              alignItems="center"
              onClick={() => {
                if (item.id === DASHBOARD_PLANNING_ID) {
                  setOpenPlanningModal(true);
                  return;
                }

                setFilter(item);
                if (setDrawerOpen) setDrawerOpen(false);
              }}
              gap={1}
              sx={{
                p: 0.75,
                borderRadius: 2,
                backgroundColor: isSelected
                  ? theme.palette.background.selectedBackground
                  : 'transparent',
                '&:hover': {
                  backgroundColor: alpha(
                    theme.palette.background.selectedBackground,
                    0.5
                  ),
                },
                position: 'relative',
              }}
            >
              {item.icon}
              <Typography
                fontSize={14}
                fontWeight={600}
                sx={{
                  textTransform:
                    item.id === DASHBOARD_PLANNING_ID ? 'uppercase' : 'none',
                }}
              >
                {item.label}
              </Typography>

              {lib.firebase.auth.isAdmin(role) &&
                item.id === INSTITUTION_PAGE_ID && (
                  <IconButton
                    sx={{ p: 0, m: 0, position: 'absolute', right: 5 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenu(true);
                    }}
                  >
                    <KeyboardArrowDown fontSize="small" />
                  </IconButton>
                )}
            </Box>
          </Box>
        );
      })}

      <Menu
        anchorEl={anchorElRef.current}
        open={openMenu && lib.firebase.auth.isAdmin(role)}
        onClose={() => {
          setOpenMenu(false);
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        {institutions.map((institution) => (
          <MenuItem
            key={institution.id}
            onClick={() => {
              setSelectedInstitution(institution);
              setSelectedGroups(
                (institution.groups || []).filter((group) =>
                  groups.some((g) => g.id === group.id)
                )
              );
              setOpenMenu(false);
            }}
          >
            <Box
              width="100%"
              display="flex"
              alignItems="center"
              justifyContent="flex-start"
              gap={1}
            >
              <Avatar
                src={institution.imageUrl || ''}
                sx={{ width: 25, height: 25 }}
              />
              <Typography>{institution.name}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>

      <DashboardPlanningModal
        open={openPlanningModal}
        setOpen={setOpenPlanningModal}
      />
    </Box>
  );
}
