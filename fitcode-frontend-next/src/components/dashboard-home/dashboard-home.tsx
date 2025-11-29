import type { SxProps } from '@mui/material';
import { Box, Grid2, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';

import DashboardPageContainer from '../dashboard/dashboard-page-container';
import CycleProgress from './cycle-progress';
import FlaggedAthletes from './flagged-athletes';
import TodaySessions from './today-sessions';
import { theme } from '@/app/style';
import { DASHBOARD_ICONS_FOLDER } from '@/lib/common/const/nav.const';
import { LINEAR_GRADIENT_BG } from '@/lib/common/const/ui.const';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { Training } from '@/core/training/type/training.type';
import { useMain } from '@/store/main.provider';
import AthleteReports from './athlete-reports';
import { useAthlete } from '@/store/athlete.provider';
import TodaySessionsComponent from './today-sessions-component';
import SelectedTrainingComponentModal from './modals/selected-training-component-modal';
import useDashboardHomeComponents from './hooks/use-components.hook';

interface Props {
  trainings: Training[];
}

export default function DashboardHome(props: Props) {
  const screenSize = useScreenSize();

  const { user } = useAuthenticatedAuth();

  const mainContext = useMain();
  const dashboardContext = useDashboard();
  const athleteContext = useAthlete();

  const { activeTraining } = mainContext;

  const { trainings } = props;

  const selectedGroups = dashboardContext
    ? dashboardContext.selectedGroups
    : mainContext.groups;

  const {
    selectedTrainingComponent,
    setSelectedTrainingComponent,
    selectedTraining,
    setSelectedTraining,
    componentItems,
    activeComponent,
  } = useDashboardHomeComponents(selectedGroups, trainings);

  const [openTrainingComponentModal, setOpenTrainingComponentModal] =
    useState(false);

  const [mounted, setMounted] = useState(false);

  const hasPlayedAudioRef = useRef(false);

  useEffect(() => {
    // small timeout is optional, just to ensure it's after first paint
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const COMPONENT_ITEMS_CONTAINER_WIDTH = 600;

  const ORANGE_COLOR_COMBO = {
    backgroundColor: theme.palette.secondary.light,
    textColor: theme.palette.secondary.contrastText,
  };

  const colorCombos = [
    {
      backgroundColor: theme.palette.background.light,
      textColor: theme.palette.text.primary,
    },
    {
      backgroundColor: theme.palette.primary.light,
      textColor: theme.palette.primary.contrastText,
    },
    ORANGE_COLOR_COMBO,
  ];

  const startOfWeek = dayjs().startOf('week');
  const endOfWeek = dayjs().endOf('week');

  const thisWeekSessions = trainings
    .filter((t) => selectedGroups.some((group) => group.id === t.groupId))
    .filter((training) => {
      const trainingDate = dayjs(training.from);

      return (
        trainingDate.isAfter(startOfWeek) && trainingDate.isBefore(endOfWeek)
      );
    });

  const cardProps: SxProps = {
    p: 2,
    borderRadius: 2,
    background: LINEAR_GRADIENT_BG,
  };

  return (
    <DashboardPageContainer>
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        gap={2}
        mt={dashboardContext ? 4 : 0}
      >
        <Typography variant="h4">
          Welcome back, <strong>{user.displayName?.split(' ')[0]}</strong>
        </Typography>
        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          sx={cardProps}
          gap={2}
        >
          <Typography variant="h6" lineHeight={1}>
            My Week
          </Typography>

          <Box
            width="100%"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            gap={1}
          >
            <Box
              width={COMPONENT_ITEMS_CONTAINER_WIDTH}
              display="flex"
              alignItems="center"
              gap={0.5}
            >
              {componentItems.map((item, index) => {
                const colors =
                  componentItems.length === 0
                    ? ORANGE_COLOR_COMBO
                    : colorCombos[index % colorCombos.length];

                return (
                  <Box
                    key={item.id}
                    width={`${item.percentage}%`}
                    display="flex"
                    flexDirection="column"
                    alignItems="flex-start"
                    justifyContent="center"
                  >
                    <Typography
                      maxWidth="100%"
                      fontWeight={200}
                      sx={{
                        ml: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.id.length
                        ? item.id.charAt(0).toUpperCase() + item.id.slice(1)
                        : ''}
                    </Typography>

                    <Box
                      width="100%"
                      display="flex"
                      alignItems="center"
                      justifyContent="flex-start"
                      sx={{
                        p: 2,
                        py: 1,
                        borderRadius: 4,
                        backgroundColor: colors.backgroundColor,
                        transformOrigin: 'left center',
                        transform: mounted ? 'scaleX(1)' : 'scaleX(0)',
                        transition: 'transform 0.5s ease-out',
                      }}
                    >
                      <Typography
                        fontWeight={500}
                        sx={{ color: colors.textColor }}
                      >
                        {item.value}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
            <Box display="flex" justifyContent="flex-end" alignItems="center">
              <Box
                display="flex"
                flexDirection="column"
                alignItems="flex-start"
                gap={1}
              >
                <Box display="flex" alignItems="flex-end" gap={0.5}>
                  <Box
                    component="img"
                    width={18}
                    height={18}
                    src={`${DASHBOARD_ICONS_FOLDER}/exercises.png`}
                    sx={{
                      objectFit: 'contain',
                      backgroundColor: theme.palette.background.paper,
                      borderRadius: 2,
                    }}
                  />
                  <Typography
                    lineHeight={0.65}
                    fontSize={screenSize.isUltraSmall ? 60 : 80}
                    fontWeight={200}
                  >
                    {thisWeekSessions.length}
                  </Typography>
                </Box>
                <Typography lineHeight={1} fontSize={14} fontWeight={200}>
                  Sessions
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        <Grid2 width="100%" container spacing={2}>
          {activeComponent && activeTraining && (
            <Grid2
              size={{ xs: 12, sm: 12, md: 4 }}
              sx={cardProps}
              display="flex"
              flexDirection="column"
              gap={1}
            >
              <Typography variant="h6" lineHeight={1}>
                Active sessions
              </Typography>

              <TodaySessionsComponent
                component={{
                  ...activeComponent,
                  groupId: activeTraining.groupId,
                  trainingId: activeTraining.id,
                }}
                trainings={trainings}
                index={0}
                setSelectedTraining={setSelectedTraining}
                setSelectedTrainingComponent={setSelectedTrainingComponent}
                setOpenTrainingComponentModal={setOpenTrainingComponentModal}
              />
            </Grid2>
          )}

          <Grid2
            size={{ xs: 12, sm: 12, md: 4 }}
            sx={cardProps}
            display="flex"
            flexDirection="column"
            gap={1}
          >
            <Typography variant="h6" lineHeight={1}>
              Today&apos;s sessions
            </Typography>

            <TodaySessions
              trainings={trainings}
              activeComponent={
                activeComponent
                  ? {
                      ...activeComponent,
                      trainingId: activeTraining?.id || '',
                    }
                  : null
              }
              setSelectedTraining={setSelectedTraining}
              setSelectedTrainingComponent={setSelectedTrainingComponent}
              setOpenTrainingComponentModal={setOpenTrainingComponentModal}
            />
          </Grid2>
          <Grid2
            size={{ xs: 12, sm: 12, md: 4 }}
            sx={cardProps}
            display="flex"
            flexDirection="column"
            gap={1}
          >
            <Typography variant="h6" lineHeight={1}>
              Cycle progress
            </Typography>

            <CycleProgress />
          </Grid2>
          <Grid2
            size={{ xs: 12, sm: 12, md: 4 }}
            sx={cardProps}
            display="flex"
            flexDirection="column"
            gap={1}
          >
            {dashboardContext ? (
              <>
                <Typography variant="h6" lineHeight={1}>
                  Flagged athletes
                </Typography>

                <FlaggedAthletes />
              </>
            ) : athleteContext ? (
              <>
                <Typography variant="h6" lineHeight={1}>
                  Reports
                </Typography>

                <AthleteReports />
              </>
            ) : (
              <></>
            )}
          </Grid2>
        </Grid2>
      </Box>

      {selectedTraining && selectedTrainingComponent && (
        <SelectedTrainingComponentModal
          open={openTrainingComponentModal}
          setOpen={setOpenTrainingComponentModal}
          training={selectedTraining}
          setTraining={setSelectedTraining}
          component={selectedTrainingComponent}
          setComponent={setSelectedTrainingComponent}
          hasPlayedAudioRef={hasPlayedAudioRef}
        />
      )}
    </DashboardPageContainer>
  );
}
