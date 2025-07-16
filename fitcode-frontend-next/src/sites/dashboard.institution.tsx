'use client';

import { theme } from '@/app/style';
import HorizontalItemsList from '@/components/horizontal-items-list/horizontal-items-list';
import { MAX_WIDTH } from '@/components/trainer-day-view/constant';
import { useDashboard } from '@/store/dashboard-provider';
import { MoreVert } from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import { useScreenSize } from '@/store/screen-size-provider';
import { AthletesTrainers } from '@/common/enum/athletes-trainer.enum';
import { useEffect, useState } from 'react';
import { SearchBar } from '@/components/search-bar/search-bar';
import { User } from '@/controller/user/type/user.type';
import { UserRole } from '@/controller/user/enum/user-role.enum';

export default function DashboardInstitutionPage() {
  const { users, selectedInstitution, selectedGroup, setSelectedGroup } =
    useDashboard();
  const screenSize = useScreenSize();

  const [selectedView, setSelectedView] = useState<AthletesTrainers>(
    AthletesTrainers.ATHLETES
  );

  const [currentUsers, setCurrentUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!users) return;

    const current = users.filter((user) => {
      const role =
        selectedView === AthletesTrainers.ATHLETES
          ? UserRole.ATHLETE
          : UserRole.TRAINER;
      if (user.customClaims.role.includes(role)) {
        return user;
      }
    });

    setSearch('');
    setCurrentUsers(current);
  }, [selectedView]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      width="100%"
      maxWidth={MAX_WIDTH}
      gap={2}
      sx={{
        backgroundColor: theme.palette.background.default,
      }}
    >
      {screenSize.isSmallTablet || screenSize.isMobile ? (
        <>
          <HorizontalItemsList
            dashboardInstitutionsView
            items={
              Object.values(AthletesTrainers).map((item) => ({
                label: item,
                value: item,
              })) || []
            }
            value={selectedView}
            setValue={(value) => {
              setSelectedView(value as AthletesTrainers);
            }}
            checkIsSameValue={(value: string) => {
              return selectedView === value;
            }}
            alertOnChange
            onArrowClick={(direction) => {}}
          />
          <Box width="100%" sx={{ position: 'relative' }}>
            <Box
              width="80%"
              display="flex"
              justifyContent="center"
              alignItems="center"
              mt={1}
              sx={{ mx: 'auto', mb: 1 }}
            >
              <Typography
                fontWeight={600}
                fontSize={16}
                textAlign="center"
                sx={{
                  textTransform: 'uppercase',
                }}
              >
                {selectedInstitution?.name || 'Select A Group'}
              </Typography>
              <IconButton
                sx={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  zIndex: 1,
                }}
              >
                <MoreVert fontSize="medium" />
              </IconButton>
            </Box>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          width="100%"
          justifyContent="space-around"
          alignItems="flex-start"
        >
          <Box
            width="25%"
            display="flex"
            justifyContent="flex-start"
            alignItems="center"
            gap={1}
            sx={{
              mt: 1,
            }}
          >
            <Box
              sx={{
                height: 16,
                width: 4,
                borderRadius: 5,
                backgroundColor: theme.palette.primary.main,
              }}
            />

            <Typography
              fontWeight={600}
              fontSize={16}
              sx={{
                textTransform: 'uppercase',
              }}
            >
              {selectedInstitution?.name || 'Select A Group'}
            </Typography>
          </Box>
          <Box width="50%">
            <HorizontalItemsList
              dashboardInstitutionsView
              items={
                Object.values(AthletesTrainers).map((item) => ({
                  label: item,
                  value: item,
                })) || []
              }
              value={selectedView}
              setValue={(value) => {
                setSelectedView(value as AthletesTrainers);
              }}
              checkIsSameValue={(value: string) => {
                return selectedView === value;
              }}
              alertOnChange
              onArrowClick={(direction) => {}}
            />
          </Box>
          <Box width="25%" display="flex" justifyContent="flex-end" mt={1}>
            <IconButton sx={{ m: 0, p: 0 }}>
              <MoreVert fontSize="large" />
            </IconButton>
          </Box>
        </Box>
      )}
      <Box
        width="100&"
        display="flex"
        sx={{
          justifyContent: 'center',
        }}
      >
        <SearchBar
          placeholder={`Search ${selectedView.toLowerCase()}`}
          value={search}
          handleSearchChange={(e) => {
            if (!users) return;

            const filtered = currentUsers.filter((user) => {
              if (!user.displayName) return false;
              return user.displayName
                .toLowerCase()
                .includes(e.target.value.toLowerCase());
            });

            setFilteredUsers(filtered);
            setSearch(e.target.value);
          }}
          maxWidth="85%"
        />
      </Box>
    </Box>
  );
}
