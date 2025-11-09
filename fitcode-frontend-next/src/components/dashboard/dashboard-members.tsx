'use client';

import { Circle } from '@mui/icons-material';
import { Box, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { MAX_WIDTH } from '../trainer-group-day-view/constant/dimensions.constant';
import { DASHBOARD_MIDDLE_HEADER_HEIGHT } from './constant/dashboard.const';
import DashboardGroupsMembers from './dashboard-groups-members';
import DashboardInstitution from './dashboard-institution';
import DashboardPageContainer from './dashboard-page-container';
import { DashboardMembersFilter } from './enum/dashboard-members-filter.enum';
import AddGroupModal from './modals/dashboard-add-group-modal';
import { theme } from '@/app/style';
import type { Group } from '@/core/group/type/group.type';
import { AthletesTrainers } from '@/core/institution/enum/athletes-trainer.enum';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import AddButton from '@/ui/add-button';

export default function DashboardMembers() {
  const screenSize = useScreenSize();

  const { groups } = useMain();

  const [filter, setFilter] = useState<DashboardMembersFilter>(
    DashboardMembersFilter.GROUP
  );

  // for group view
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // for institution view
  const [athletesOrTrainers, setAthletesOrTrainers] =
    useState<AthletesTrainers>(AthletesTrainers.ATHLETES);

  useEffect(() => {
    if (!selectedGroup && groups.length > 0) {
      setSelectedGroup(groups[0]);
      return;
    }

    setSelectedGroup(
      groups.find((group) => group.id === selectedGroup?.id) || null
    );
  }, [groups, selectedGroup]);

  function renderFilterHeaderContent() {
    switch (filter) {
      case DashboardMembersFilter.GROUP:
        return (
          <Box
            key="groups-list-container"
            width="100%"
            maxWidth={MAX_WIDTH}
            display="flex"
            gap={0.5}
            alignItems="center"
            sx={{
              position: 'relative',
              px: 8,
              pl: screenSize.isMobile ? 0 : undefined,
            }}
          >
            <Box
              key="groups-list"
              display="flex"
              alignItems="center"
              gap={1.5}
              sx={{
                overflowX: 'auto',
                ...styledScrollbarSx(theme),
                mx: 'auto',
              }}
            >
              {groups.map((group) => {
                const isSelected = selectedGroup?.id === group.id;

                return (
                  <Tooltip key={group.id} title={group.name} arrow>
                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      onClick={() => {
                        setSelectedGroup(group);
                      }}
                      sx={{
                        px: 2,
                        py: 0.5,
                        backgroundColor: isSelected
                          ? theme.palette.primary.main
                          : theme.palette.background.default,
                        border: isSelected
                          ? `1px solid ${theme.palette.primary.main}`
                          : `1px solid ${theme.palette.text.primary}`,
                        borderRadius: 1,
                        cursor: 'pointer',
                      }}
                    >
                      <Typography
                        textAlign="center"
                        fontWeight={600}
                        width={80}
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: isSelected
                            ? theme.palette.text.secondary
                            : theme.palette.text.primary,
                          userSelect: 'none',
                        }}
                      >
                        {group.name}
                      </Typography>
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
            <Box
              sx={{
                position: 'absolute',
                right: 10,
              }}
            >
              <AddButton
                onClick={() => setOpenAddGroupModal(true)}
                sx={{ p: 1 }}
              />
            </Box>
          </Box>
        );
      case DashboardMembersFilter.MEMBERS:
        return (
          <Box
            width="100%"
            display="flex"
            justifyContent="center"
            gap={1}
            alignItems="center"
          >
            {/* Athletes / Trainers selector */}
            {Object.values(AthletesTrainers).map((type) => {
              const isSelected = athletesOrTrainers === type;

              return (
                <Box
                  key={type}
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  onClick={() => {
                    setAthletesOrTrainers(type);
                  }}
                  sx={{
                    px: 2,
                    py: 0.5,
                    backgroundColor: isSelected
                      ? theme.palette.primary.main
                      : theme.palette.background.default,
                    border: isSelected
                      ? `1px solid ${theme.palette.primary.main}`
                      : `1px solid ${theme.palette.text.primary}`,
                    borderRadius: 1,
                    cursor: 'pointer',
                  }}
                >
                  <Typography
                    textAlign="center"
                    fontWeight={600}
                    width={80}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: isSelected
                        ? theme.palette.text.secondary
                        : theme.palette.text.primary,
                      userSelect: 'none',
                    }}
                  >
                    {type.charAt(0)?.toUpperCase() +
                      type.slice(1)?.toLowerCase()}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        );
      default:
        return null;
    }
  }

  function renderFilterContent() {
    switch (filter) {
      case DashboardMembersFilter.GROUP:
        return <DashboardGroupsMembers group={selectedGroup} />;
      case DashboardMembersFilter.MEMBERS:
        return <DashboardInstitution selectedView={athletesOrTrainers} />;
      default:
        return null;
    }
  }

  const [openAddGroupModal, setOpenAddGroupModal] = useState(false);

  return (
    <DashboardPageContainer>
      <Box
        width="100%"
        height={DASHBOARD_MIDDLE_HEADER_HEIGHT}
        display="flex"
        flexDirection="column"
        justifyContent="space-around"
        alignItems="center"
      >
        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          maxWidth={MAX_WIDTH}
          sx={{
            overflowX: 'auto',
          }}
        >
          {Object.values(DashboardMembersFilter).map((f) => {
            const isSelected = filter === f;

            return (
              <Box
                key={f}
                display="flex"
                alignItems="center"
                sx={{
                  cursor: 'pointer',
                }}
                onClick={() => setFilter(f)}
                gap={0.5}
              >
                {isSelected && (
                  <Circle
                    sx={{ color: theme.palette.primary.main, fontSize: 12 }}
                  />
                )}
                <Typography
                  fontSize={14}
                  fontWeight={600}
                  sx={{
                    textTransform: 'uppercase',
                    color: isSelected
                      ? theme.palette.primary.main
                      : theme.palette.text.primary,
                  }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1).toLowerCase()}
                </Typography>
              </Box>
            );
          })}
        </Box>
        {renderFilterHeaderContent()}
      </Box>

      {renderFilterContent()}

      <AddGroupModal
        open={openAddGroupModal}
        setOpen={setOpenAddGroupModal}
        setSelectedGroup={setSelectedGroup}
      />
    </DashboardPageContainer>
  );
}
