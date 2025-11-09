'use client';

import { Box, Typography } from '@mui/material';
import AthleteOptionsContainer from '../athlete/athlete-options-container';
import { EMPTY_STRING } from '@/lib/common/const/string.const';
import { MAX_WIDTH } from '../trainer-group-day-view/constant/dimensions.constant';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import { theme } from '@/app/style';
import { useMain } from '@/store/main.provider';
import { redirect } from 'next/navigation';
import { LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS } from '@/lib/common/const/nav.const';
import { lib } from '@/lib';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useEffect, useState } from 'react';
import { Group } from '@/core/group/type/group.type';
import { DASHBOARD_MIDDLE_HEADER_HEIGHT } from './constant/dashboard.const';
import { SearchBar } from '@/ui/search-bar/search-bar';

export default function DashboardGroups() {
  const { role } = useAuthenticatedAuth();
  const { groups } = useMain();

  const [filteredGroups, setFilteredGroups] = useState<Group[]>(groups);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredGroups(groups);
      return;
    }
    const lowerSearch = search.toLowerCase();
    const filtered = groups.filter((group) =>
      group.name.toLowerCase().includes(lowerSearch)
    );
    setFilteredGroups(filtered);
  }, [search, groups]);

  const permissionOk =
    lib.firebase.auth.isTrainer(role) || lib.firebase.auth.isManager(role);

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{ px: 2, py: 1 }}
      gap={2}
    >
      {/* Dashboard Middle Header */}
      <Box
        height={DASHBOARD_MIDDLE_HEADER_HEIGHT}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <SearchBar
          placeholder="Search Groups"
          value={search}
          handleSearchChange={(e) => setSearch(e.target.value)}
          maxWidth="100%"
        />
      </Box>
      <AthleteOptionsContainer
        items={[EMPTY_STRING, EMPTY_STRING]}
        selectedItem={'none'}
        onClick={(type) => {}}
        title="Groups"
        disabled
      />
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexWrap="wrap"
        maxWidth={MAX_WIDTH}
        gap={4}
      >
        {filteredGroups.map((group) => {
          const shortGroupName = group.name.substring(0, 3);

          return (
            <Box
              height="100%"
              key={group.id}
              display="flex"
              justifyContent="center"
              alignItems="center"
              onClick={() => {
                if (!permissionOk) return;

                redirect(
                  LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS(group.id).home.href
                );
              }}
              sx={{
                p: 5,
                borderRadius: '50%',
                backgroundColor: theme.palette.primary.main,
                my: 'auto',
                cursor: permissionOk ? 'pointer' : undefined,
              }}
            >
              <Typography
                fontWeight={600}
                textAlign="center"
                sx={{
                  color: theme.palette.text.secondary,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  my: 'auto',
                  userSelect: 'none',
                }}
              >
                {shortGroupName}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
