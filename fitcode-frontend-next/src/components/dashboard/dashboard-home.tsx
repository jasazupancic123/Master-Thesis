import { alpha, Box, SxProps, Typography } from '@mui/material';

import DashboardPageContainer from './dashboard-page-container';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useEffect, useState } from 'react';
import { theme } from '@/app/style';
import { useDashboard } from '@/store/dashboard.provider';
import { DASHBOARD_ICONS_FOLDER } from '@/lib/common/const/nav.const';
import dayjs from 'dayjs';
import { percent } from 'framer-motion';

export default function DashboardHome() {
  const { user } = useAuthenticatedAuth();
  const { trainings } = useDashboard();

  const COMPONENT_ITEMS_CONTAINER_WIDTH = 600;

  const [componentItems, setComponentItems] = useState<
    {
      id: string;
      percentage: number; // in %
      value: number;
    }[]
  >([]);

  const colorCombos = [
    {
      backgroundColor: theme.palette.background.light,
      textColor: theme.palette.text.primary,
    },
    {
      backgroundColor: theme.palette.primary.light,
      textColor: theme.palette.primary.contrastText,
    },
    {
      backgroundColor: theme.palette.secondary.light,
      textColor: theme.palette.secondary.contrastText,
    },
  ];

  const startOfWeek = dayjs().startOf('week');
  const endOfWeek = dayjs().endOf('week');

  const thisWeekSessions = trainings.filter((training) => {
    const trainingDate = dayjs(training.from);

    return (
      trainingDate.isAfter(startOfWeek) && trainingDate.isBefore(endOfWeek)
    );
  });

  useEffect(() => {
    const componentIdCounter: { id: string; count: number }[] = [];

    trainings.forEach((training) => {
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
  }, [trainings]);

  const cardProps: SxProps = {
    p: 2,
    borderRadius: 2,
    background: `linear-gradient(135deg, ${theme.palette.background.dark} 0%, ${alpha(theme.palette.background.light, 0.5)} 100%, ${theme.palette.background.light} 100%)`,
  };

  return (
    <DashboardPageContainer>
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        gap={2}
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
          >
            <Box
              width={COMPONENT_ITEMS_CONTAINER_WIDTH}
              display="flex"
              alignItems="center"
              gap={0.5}
            >
              {componentItems.map((item, index) => {
                return (
                  <Box
                    key={item.id}
                    width={`${item.percentage}%`}
                    display="flex"
                    flexDirection="column"
                    alignItems="flex-start"
                    justifyContent="center"
                  >
                    <Typography fontWeight={200} sx={{ ml: 1 }}>
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
                        backgroundColor:
                          colorCombos[index % colorCombos.length],
                      }}
                    >
                      <Typography
                        fontWeight={500}
                        sx={{
                          color:
                            colorCombos[index % colorCombos.length].textColor,
                        }}
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
                  <Typography lineHeight={0.65} fontSize={80} fontWeight={200}>
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
      </Box>
    </DashboardPageContainer>
  );
}
