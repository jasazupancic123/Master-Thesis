'use client';

import {
  Circle,
  EditOutlined,
  PlayCircleOutline,
  Visibility,
} from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { Fragment } from 'react';

import { DashboardTrainingPlanFilter } from './enum/dashboard-training-plan-filter.enum';
import { theme } from '@/app/style';
import { Components } from '@/core/exercise/constant/components.constant';
import { Targets } from '@/core/exercise/constant/target.constant';
import type { Component } from '@/core/exercise/type/component.type';
import type { Training } from '@/core/training/type/training.type';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import { useMain } from '@/store/main.provider';
import { useScreenSize } from '@/store/screen-size.provider';

interface Props {
  trainings: Training[];
  filter: DashboardTrainingPlanFilter;
  upcoming?: boolean; // if true, then completed trainings were passed, if false, then upcoming
}

export default function DashboardTrainingsList(props: Props) {
  const router = useRouter();
  const screenSize = useScreenSize();
  const { groups } = useMain();

  const { trainings, filter, upcoming } = props;

  const enabledComponents: (Component | undefined)[] =
    filter === DashboardTrainingPlanFilter.GAMES
      ? [Components.find((c) => c.field === 'competition')]
      : Components.filter((c) => c.field !== 'competition');

  const enabledComponentIds = enabledComponents
    .filter((c) => c !== undefined)
    .map((c) => c.field);

  return (
    <Box
      width="100%"
      height={screenSize.isMobile ? '70vh' : '60vh'}
      display="flex"
      flexDirection="column"
      sx={{
        overflowY: 'auto',
        pr: 0.5,
        ...styledScrollbarSx(theme),
      }}
      gap={2}
    >
      {trainings.map((training) => {
        const group = groups.find((g) => g.id === training.groupId);
        if (!group) return null;

        return (
          <Fragment key={training.id}>
            {training.components
              .filter((component) => enabledComponentIds.includes(component.id))
              .map((component) => {
                const target = Targets.find(
                  (t) =>
                    t.field === component.targetId &&
                    t.componentId === component.id
                );

                const trainingName = `${group.shortName} - ${component.id}${target ? ` - ${target.name}` : ''}`;

                const periodLabel =
                  new Date(training.from).getHours() < 12
                    ? 'Morning'
                    : 'Afternoon';

                const time = dayjs(training.from).format('HH:mm');
                const timeLabel = `${periodLabel}, ${time}`;

                const isToday =
                  upcoming && dayjs(training.from).isSame(dayjs(), 'day');
                const dateLabel = isToday
                  ? 'Today'
                  : dayjs(training.from).format('D-MMM');

                return (
                  <Box
                    key={`${training.id}-${component.id}`}
                    height={50}
                    width="100%"
                    display="flex"
                    alignItems="center"
                    gap={1}
                    sx={{
                      borderRadius: 1,
                      p: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: theme.palette.background.light,
                      },
                    }}
                    onClick={() => {
                      router.push(
                        `/groups/${group.id}?training=${training.id}&component=${component.id}`
                      );
                    }}
                  >
                    <Circle
                      sx={{
                        color:
                          upcoming && isToday
                            ? theme.palette.primary.main
                            : 'transparent',
                        fontSize: 16,
                      }}
                    />
                    <Box
                      width="90%"
                      display="flex"
                      justifyContent="center"
                      flexDirection="column"
                    >
                      <Typography fontSize={12} lineHeight={1}>
                        {timeLabel}
                      </Typography>

                      <Typography
                        fontSize={16}
                        fontWeight={600}
                        sx={{
                          color: theme.palette.primary.main,
                          textTransform: 'uppercase',
                        }}
                      >
                        {trainingName}
                      </Typography>

                      <Typography
                        fontSize={12}
                        lineHeight={1}
                        sx={{ textTransform: 'uppercase' }}
                      >
                        {dateLabel}
                      </Typography>
                    </Box>
                    <Box
                      width="60px"
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      gap={1}
                    >
                      {!upcoming ? (
                        <Visibility fontSize="small" />
                      ) : (
                        <>
                          <PlayCircleOutline fontSize="small" />
                          <EditOutlined fontSize="small" />
                        </>
                      )}
                    </Box>
                  </Box>
                );
              })}
          </Fragment>
        );
      })}
    </Box>
  );
}
