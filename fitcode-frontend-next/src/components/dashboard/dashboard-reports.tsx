'use client';

import { Avatar, Box, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import ExerciseChips from '../exercise-chips/exercise-chips';
import AthleteTrainingsRealizationChart from '../reports/athlete-trainings-realization-chart';
import GroupTrainingReportChart from '../reports/group-training-report-chart';
import WellnessChart from '../reports/wellness-chart';
import { MAX_WIDTH } from '../trainer-group-day-view/constant/dimensions.constant';
import { DASHBOARD_MIDDLE_HEADER_HEIGHT } from './constant/dashboard.const';
import DashboardPageContainer from './dashboard-page-container';
import useDashboardGroupView from './hooks/use-group-view';
import { theme } from '@/app/style';
import type { AuthUser } from '@/core/auth/type/user.type';
import type { Component } from '@/core/exercise/type/component.type';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import type { SetState } from '@/lib/common/type/state.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { Workload } from '@/core/training/type/workload.type';
import AthleteExerciseReports from '../report-athlete-exercise/athlete-exercise-reports';
import { useMain } from '@/store/main.provider';

enum ReportTab {
  Realization = 'Realization',
  Wellness = 'Wellness',
  Exercise = 'Exercise',
}

const cache = new Map<string, Workload[]>(); // LATER PUT THIS EVEN ONE HIGHER, SO IT CAN BE SHARED BETWEEN MULTIPLE REPORTS

export default function DashboardReports() {
  const screenSize = useScreenSize();

  const { groups } = useMain();
  const { selectedInstitution } = useDashboard();
  const { selectedGroup, setSelectedGroup } = useDashboardGroupView();
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(
    null
  );

  const [tab, setTab] = useState<ReportTab>(ReportTab.Realization);

  useEffect(() => {
    setSelectedUser(null);
  }, [selectedGroup]);

  return (
    <DashboardPageContainer>
      <Tabs
        value={tab}
        onChange={(_, newValue) => setTab(newValue as ReportTab)}
        textColor="primary"
        indicatorColor="primary"
      >
        {Object.values(ReportTab).map((t) => (
          <Tab
            key={t}
            value={t}
            label={t}
            sx={{
              textTransform: 'none',
              color: theme.palette.text.primary,
            }}
          />
        ))}
      </Tabs>

      {tab === ReportTab.Exercise ? (
        <AthleteExerciseReports cache={cache} />
      ) : (
        <>
          <Box
            width="100%"
            height={DASHBOARD_MIDDLE_HEADER_HEIGHT}
            display="flex"
            flexDirection="column"
            justifyContent="space-around"
            alignItems="center"
            gap={2}
          >
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
            </Box>

            <Box
              width="100%"
              display="flex"
              justifyContent="center"
              gap={1}
              alignItems="center"
            >
              {(selectedGroup?.members || []).map((user) => {
                if (!user || !user.displayName) return;

                return (
                  <Box
                    key={user.uid}
                    display="flex"
                    flexDirection="column"
                    gap={1}
                    sx={{
                      position: 'relative',
                      border:
                        user.uid === selectedUser?.uid
                          ? `2px solid ${theme.palette.primary.main}`
                          : '2px solid transparent',
                      borderRadius: '50%',
                      padding: '1px',
                    }}
                  >
                    <Tooltip title={user.displayName}>
                      <Avatar
                        className="avatar-border"
                        src={user.photoURL || USER_AVATAR_IMG_URL}
                        sx={{
                          width: screenSize.isMobile ? 20 : 35,
                          height: screenSize.isMobile ? 20 : 35,
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setSelectedUser(
                            user.uid === selectedUser?.uid ? null : user
                          );
                        }}
                      />
                    </Tooltip>
                  </Box>
                );
              })}
            </Box>

            <ExerciseChips
              tooltip
              iconSize={20}
              disabledComponents={['other']}
              gap={0}
              selected={selectedComponent}
              setSelected={
                setSelectedComponent as SetState<
                  undefined | null | Component | Component[]
                >
              }
            />
          </Box>

          {/* Tabs */}

          {tab === ReportTab.Realization && (
            <Box>
              <GroupTrainingReportChart
                groupId={selectedGroup?.id}
                selectedUserId={selectedUser?.uid}
                selectedComponentId={selectedComponent?.field}
              />

              {selectedUser && (
                <AthleteTrainingsRealizationChart
                  institutionId={selectedInstitution!.id}
                  athleteId={selectedUser.uid}
                  componentId={
                    selectedComponent && !Array.isArray(selectedComponent)
                      ? selectedComponent.field
                      : undefined
                  }
                />
              )}
            </Box>
          )}

          {tab === ReportTab.Wellness && (
            <WellnessChart
              groupId={selectedGroup?.id}
              selectedUserId={selectedUser?.uid}
            />
          )}
        </>
      )}
    </DashboardPageContainer>
  );
}
