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

export default function DashboardTrainingPlan() {
  const theme = useTheme();

  const { groups } = useMain();
  const { trainings, selectedInstitution } = useDashboard();

  const {
    selectedGroups,
    setSelectedGroups,
    completedTrainings,
    upcomingTrainings,
  } = useTrainingPlan(trainings);

  if (!selectedInstitution) return null;

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{ py: 1 }}
      gap={2}
    >
      {/* Dashboard Middle Header */}
      <Box
        height={DASHBOARD_MIDDLE_HEADER_HEIGHT}
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
                  border: `1px solid ${theme.palette.primary.main}`,
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
                      : theme.palette.primary.main,
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
        width="100%"
        sx={{
          position: 'relative',
          borderTop: `1px solid ${theme.palette.primary.main}`,
        }}
      >
        <AthleteOptionsContainer
          items={['Completed', 'Upcoming']}
          selectedItem={''}
          onClick={(type) => {}}
          title="Sessions"
          disabled
        />
      </Box>

      <Box width="100%" display="flex" justifyContent="space-between">
        <Box width="50%" display="flex" justifyContent="center">
          <Box width="70%">
            <DashboardTrainingsList
              trainings={completedTrainings}
              selectedGroups={selectedGroups}
            />
          </Box>
        </Box>
        <Box width="50%" display="flex" justifyContent="center">
          <Box width="70%">
            <DashboardTrainingsList
              trainings={upcomingTrainings}
              selectedGroups={selectedGroups}
              upcoming
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
