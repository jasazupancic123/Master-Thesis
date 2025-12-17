import { KeyboardArrowDown } from '@mui/icons-material';
import { alpha, Box, IconButton, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

import { theme } from '@/app/style';
import { lib } from '@/lib';
import {
  DASHBOARD_VIEWS,
  INSTITUTION_PAGE_ID,
  LINK_DASHBOARD_PLANNING,
  LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS,
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
  const router = useRouter();
  const { role } = useAuthenticatedAuth();

  const { institution } = useMain();

  const { filter, setFilter } = useDashboard();

  const { setDrawerOpen } = props;

  const anchorElRef = useRef<HTMLDivElement | null>(null);

  const dashboardItems: ILink[] = DASHBOARD_VIEWS(role!);

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      gap={1}
      mt={3.3}
    >
      {dashboardItems.map((item) => {
        if (!item) return null;

        const isSelected = item.id === filter?.id;

        return (
          <Box
            ref={item.id === INSTITUTION_PAGE_ID ? anchorElRef : null}
            width="100%"
            display="flex"
            justifyContent={
              item.id === LINK_DASHBOARD_PLANNING.id ? 'center' : 'flex-start'
            }
            alignItems="center"
            onClick={() => {
              if (item.id === LINK_DASHBOARD_PLANNING.id) {
                const group = institution.groups.sort((a, b) =>
                  a.name.localeCompare(b.name)
                )[0];

                if (!group) return;

                router.push(
                  LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS(group.id).home.href
                );
                return;
              }

              setFilter(item);
              if (setDrawerOpen) setDrawerOpen(false);
            }}
            gap={1}
            sx={{
              borderRadius: 2,
              cursor: 'pointer',
              p: 0.75,
              py: item.id === LINK_DASHBOARD_PLANNING.id ? 1.5 : undefined,
              mb: item.id === LINK_DASHBOARD_PLANNING.id ? 2 : 0,
              backgroundColor:
                item.id === LINK_DASHBOARD_PLANNING.id
                  ? theme.palette.primary.main
                  : isSelected
                    ? theme.palette.background.selectedBackground
                    : 'transparent',
              '&:hover': {
                backgroundColor:
                  item.id === LINK_DASHBOARD_PLANNING.id
                    ? undefined
                    : alpha(theme.palette.background.selectedBackground, 0.5),
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
                  item.id === LINK_DASHBOARD_PLANNING.id ? 'uppercase' : 'none',
                color:
                  item.id === LINK_DASHBOARD_PLANNING.id
                    ? theme.palette.text.secondary
                    : undefined,
              }}
            >
              {item.label}
            </Typography>

            {lib.firebase.auth.isAdmin(role) &&
              item.id === INSTITUTION_PAGE_ID && (
                <IconButton sx={{ p: 0, m: 0, position: 'absolute', right: 5 }}>
                  <KeyboardArrowDown fontSize="small" />
                </IconButton>
              )}
          </Box>
        );
      })}
    </Box>
  );
}
