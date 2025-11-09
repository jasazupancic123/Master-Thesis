'use client';

import { Box, Typography } from '@mui/material';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';

import AthleteOptionsContainer from '../athlete/athlete-options-container';
import { MAX_WIDTH } from '../trainer-group-day-view/constant/dimensions.constant';
import { DASHBOARD_MIDDLE_HEADER_HEIGHT } from './constant/dashboard.const';
import DashboardPageContainer from './dashboard-page-container';
import { theme } from '@/app/style';
import type { Group } from '@/core/group/type/group.type';
import { lib } from '@/lib';
import { LINKS_TRAINER_GROUP_SIDEBAR_MAIN_ITEMS } from '@/lib/common/const/nav.const';
import { EMPTY_STRING } from '@/lib/common/const/string.const';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';
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
    <DashboardPageContainer>
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
          return (
            <Box
              width={100}
              height={100}
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
                borderRadius: 2,
                border: `1px solid ${theme.palette.primary.main}`,
                my: 'auto',
                cursor: permissionOk ? 'pointer' : undefined,
              }}
            >
              <Typography
                fontWeight={600}
                textAlign="center"
                sx={{
                  color: theme.palette.text.primary,
                  textTransform: 'uppercase',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                  my: 'auto',
                  userSelect: 'none',
                }}
              >
                {group.name}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </DashboardPageContainer>
  );
}
