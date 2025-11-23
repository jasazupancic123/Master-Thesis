'use client';

import { Circle } from '@mui/icons-material';
import { Typography, useTheme } from '@mui/material';
import { Box } from '@mui/material';
import { useState } from 'react';

import AthleteOptionsContainer from '../athlete/athlete-options-container';
import { DASHBOARD_MIDDLE_HEADER_HEIGHT } from './constant/dashboard.const';
import DashboardPageContainer from './dashboard-page-container';
import DashboardTrainingsList from './dashboard-trainings-list';
import { DashboardTrainingPlanFilter } from './enum/dashboard-training-plan-filter.enum';
import useDashboardScheduleSnapshots from './hooks/use-snapshots';
import useTrainingPlan from './hooks/use-training-plan-trainings';
import { MAX_WIDTH } from '@/components/trainer-group-day-view/constant/dimensions.constant';
import { useDashboard } from '@/store/dashboard.provider';

export default function DashboardSchedule() {
  const theme = useTheme();

  const { selectedInstitution } = useDashboard();

  const { completedTrainings, upcomingTrainings } = useTrainingPlan();

  useDashboardScheduleSnapshots();

  const [filter, setFilter] = useState<DashboardTrainingPlanFilter>(
    DashboardTrainingPlanFilter.TRAININGS
  );

  if (!selectedInstitution) return null;

  return (
    <DashboardPageContainer>
      {/* Dashboard Middle Header */}
      <Box
        width="100%"
        height={DASHBOARD_MIDDLE_HEADER_HEIGHT}
        display="flex"
        flexDirection="column"
        justifyContent="space-around"
        alignItems="center"
        maxWidth={MAX_WIDTH}
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
          {Object.values(DashboardTrainingPlanFilter).map((f) => {
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
                  {f.charAt(0)?.toUpperCase() + f.slice(1)?.toLowerCase()}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      <AthleteOptionsContainer
        items={['Completed', 'Upcoming']}
        selectedItem={''}
        onClick={(_) => {}}
        title="Sessions"
        disabled
      />

      <Box width="100%" display="flex" justifyContent="space-between">
        <Box width="50%" display="flex" justifyContent="center">
          <Box width="70%">
            <DashboardTrainingsList
              trainings={completedTrainings}
              filter={filter}
            />
          </Box>
        </Box>

        <Box width="50%" display="flex" justifyContent="center">
          <Box width="70%">
            <DashboardTrainingsList
              trainings={upcomingTrainings}
              filter={filter}
              upcoming
            />
          </Box>
        </Box>
      </Box>
    </DashboardPageContainer>
  );
}
