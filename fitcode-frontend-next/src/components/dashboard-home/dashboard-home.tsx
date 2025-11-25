import type { SxProps } from '@mui/material';
import { Box, Grid2, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import DashboardPageContainer from '../dashboard/dashboard-page-container';
import DashboardHomeCycleProgress from './dashboard-home-cycle-progress';
import DashboardHomeFlaggedAthletes from './dashboard-home-flagged-athletes';
import DashboardHomeTodaySessions from './dashboard-home-today-sessions';
import { theme } from '@/app/style';
import { DASHBOARD_ICONS_FOLDER } from '@/lib/common/const/nav.const';
import { LINEAR_GRADIENT_BG } from '@/lib/common/const/ui.const';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useDashboard } from '@/store/dashboard.provider';
import { useScreenSize } from '@/store/screen-size.provider';

export default function DashboardHome() {
  const screenSize = useScreenSize();

  const { user } = useAuthenticatedAuth();
  const { selectedGroups, trainings } = useDashboard();

  const COMPONENT_ITEMS_CONTAINER_WIDTH = 600;

  const [componentItems, setComponentItems] = useState<
    {
      id: string;
      percentage: number; // in %
      value: number;
    }[]
  >([]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // small timeout is optional, just to ensure it's after first paint
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

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

  useEffect(() => {
    const componentIdCounter: { id: string; count: number }[] = [];

    trainings
      .filter((training) =>
        selectedGroups.some((group) => group.id === training.groupId)
      )
      .forEach((training) => {
        training.components.forEach((component) => {
          const existingComponent = componentIdCounter.find(
            (item) => item.id === component.id
          );
          if (existingComponent) {
            existingComponent.count += 1;
          } else {
            componentIdCounter.push({ id: component.id, count: 1 });
          }
        });
      });

    const totalCount = componentIdCounter.reduce(
      (acc, item) => acc + item.count,
      0
    );
    const componentItems = componentIdCounter
      .map((item) => ({
        id: item.id,
        percentage:
          totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0,
        value: item.count,
      }))
      .sort((a, b) => b.value - a.value);

    setComponentItems(componentItems);
  }, [selectedGroups, trainings]);

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
        mt={4}
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

            <DashboardHomeTodaySessions />
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

            <DashboardHomeCycleProgress />
          </Grid2>
          <Grid2
            size={{ xs: 12, sm: 12, md: 4 }}
            sx={cardProps}
            display="flex"
            flexDirection="column"
            gap={1}
          >
            <Typography variant="h6" lineHeight={1}>
              Flagged athletes
            </Typography>

            <DashboardHomeFlaggedAthletes />
          </Grid2>
        </Grid2>
      </Box>
    </DashboardPageContainer>
  );
}
