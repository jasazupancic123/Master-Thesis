'use client';

import { Tooltip, Typography, useTheme } from '@mui/material';
import { Box } from '@mui/material';

import { MAX_WIDTH } from '@/components/trainer-group-day-view/constant/dimensions.constant';
import { useDashboard } from '@/store/dashboard.provider';
import { useMain } from '@/store/main.provider';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import AthleteOptionsContainer from '../athlete/athlete-options-container';
import DashboardTrainingsList from './dashboard-trainings-list';
import useTrainingPlan from './hooks/use-training-plan-trainings';
import { DASHBOARD_MIDDLE_HEADER_HEIGHT } from './constant/dashboard.const';
import DashboardPageContainer from './dashboard-page-container';
import { DashboardTrainingPlanFilter } from './enum/dashboard-training-plan-filter.enum';
import { useState } from 'react';
import { Circle } from '@mui/icons-material';

export default function DashboardTrainingPlan() {
  const theme = useTheme();

  const { groups } = useMain();
  const { trainings, selectedInstitution } = useDashboard();

  const {
    selectedGroups,
    setSelectedGroups,
    completedTrainings,
    upcomingTrainings,
  } = useTrainingPlan(trainings, groups);

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
        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          maxWidth={MAX_WIDTH}
          sx={{
            overflowX: 'auto',
            ...styledScrollbarSx(theme),
          }}
        >
          {groups.map((group) => {
            const isSelected = selectedGroups.some((g) => g.id === group.id);

            return (
              <Tooltip key={group.id} title={group.name} arrow>
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedGroups((prev) =>
                        prev.filter((g) => g.id !== group.id)
                      );
                    } else {
                      setSelectedGroups((prev) => [...prev, group]);
                    }
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

      <AthleteOptionsContainer
        items={['Completed', 'Upcoming']}
        selectedItem={''}
        onClick={(type) => {}}
        title="Sessions"
        disabled
      />

      <Box width="100%" display="flex" justifyContent="space-between">
        <Box width="50%" display="flex" justifyContent="center">
          <Box width="70%">
            <DashboardTrainingsList
              trainings={completedTrainings}
              selectedGroups={selectedGroups}
              filter={filter}
            />
          </Box>
        </Box>
        <Box width="50%" display="flex" justifyContent="center">
          <Box width="70%">
            <DashboardTrainingsList
              trainings={upcomingTrainings}
              selectedGroups={selectedGroups}
              filter={filter}
              upcoming
            />
          </Box>
        </Box>
      </Box>
    </DashboardPageContainer>
  );
}
