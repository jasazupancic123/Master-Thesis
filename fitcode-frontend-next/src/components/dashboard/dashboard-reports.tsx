'use client';

import { Avatar, Box, Tab, Tabs, Tooltip } from '@mui/material';
import { useEffect, useState } from 'react';

import ExerciseChips from '../exercise-chips/exercise-chips';
import AthleteExerciseReports from '../report-athlete-exercise/athlete-exercise-reports';
import WellnessReports from '../report-wellness/wellness-reports';
import AthleteTrainingsRealizationChart from '../reports/athlete-trainings-realization-chart';
import GroupTrainingReportChart from '../reports/group-training-report-chart';
import { DASHBOARD_MIDDLE_HEADER_HEIGHT } from './constant/dashboard.const';
import DashboardPageContainer from './dashboard-page-container';
import useAthleteExerciseReports from './hooks/use-athlete-exercise-reports';
import { theme } from '@/app/style';
import type { AuthUser } from '@/core/auth/type/user.type';
import type { Component } from '@/core/exercise/type/component.type';
import type { Workload } from '@/core/training/type/workload.type';
import { USER_AVATAR_IMG_URL } from '@/lib/common/const/image.const';
import type { SetState } from '@/lib/common/type/state.type';
import { useDashboard } from '@/store/dashboard.provider';
import { useScreenSize } from '@/store/screen-size.provider';

enum ReportTab {
  Exercise = 'Exercise',
  Wellness = 'Wellness',
  Realization = 'Realization',
}

const cache = new Map<string, Workload[]>(); // LATER PUT THIS EVEN ONE HIGHER, SO IT CAN BE SHARED BETWEEN MULTIPLE REPORTS

export default function DashboardReports() {
  const screenSize = useScreenSize();

  const { selectedInstitution } = useDashboard();
  const { selectedGroup } = useDashboard();
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(
    null
  );

  useEffect(() => {
    setSelectedUser(null);
  }, [selectedGroup]);

  const { athleteExerciseReports, setAthleteExercisesReports } =
    useAthleteExerciseReports();

  const [tab, setTab] = useState<ReportTab>(ReportTab.Exercise);

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
        <AthleteExerciseReports
          reports={athleteExerciseReports}
          setReports={setAthleteExercisesReports}
          cache={cache}
        />
      ) : tab === ReportTab.Wellness ? (
        <WellnessReports
          groupId={selectedGroup?.id}
          selectedUserId={selectedUser?.uid}
        />
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
        </>
      )}
    </DashboardPageContainer>
  );
}
