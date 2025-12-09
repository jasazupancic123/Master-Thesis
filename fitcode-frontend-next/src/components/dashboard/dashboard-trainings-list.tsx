'use client';

import {
  Circle,
  Dock,
  EditNote,
  PlayCircleOutline,
  StopCircleOutlined,
} from '@mui/icons-material';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { Fragment } from 'react';
import toast from 'react-hot-toast';

import { DashboardTrainingPlanFilter } from './enum/dashboard-training-plan-filter.enum';
import { theme } from '@/app/style';
import { Components } from '@/core/exercise/constant/components.constant';
import { Targets } from '@/core/exercise/constant/target.constant';
import type { Component } from '@/core/exercise/type/component.type';
import { TrainingController } from '@/core/training/training.controller';
import type { Training } from '@/core/training/type/training.type';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import { handleApiRequest } from '@/lib/common/type/state.type';
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
                      display="flex"
                      justifyContent="flex-end"
                      alignItems="center"
                      gap={1}
                    >
                      {!upcoming ? (
                        <>
                          <Tooltip title="Start Training">
                            <IconButton
                              onClick={async (e) => {
                                e.stopPropagation();

                                if (!training || !component) return;

                                handleApiRequest(
                                  router,
                                  () =>
                                    TrainingController.getInstance().startTrainingComponent(
                                      training.id,
                                      component.id
                                    ),
                                  () => {
                                    toast.success(
                                      'Component started successfully.'
                                    );
                                  },
                                  undefined,
                                  'Failed to start component.'
                                );
                              }}
                              sx={{ p: 0, m: 0 }}
                            >
                              <PlayCircleOutline fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Stop Training">
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();

                                if (!training || !component) return;

                                handleApiRequest(
                                  router,
                                  () =>
                                    TrainingController.getInstance().completeTrainingComponent(
                                      training.id,
                                      component.id
                                    ),
                                  () => {
                                    toast.success(
                                      'Component stopped successfully.'
                                    );
                                  },
                                  undefined,
                                  'Failed to stop component.'
                                );
                              }}
                              sx={{ p: 0, m: 0 }}
                            >
                              <StopCircleOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Recap">
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/training/${training.id}/component/${component.id}/recap`
                                );
                              }}
                              sx={{ p: 0, m: 0 }}
                            >
                              <EditNote fontSize="small" />{' '}
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <Tooltip title="Start Training">
                            <IconButton
                              onClick={async (e) => {
                                e.stopPropagation();

                                if (!training || !component) return;

                                handleApiRequest(
                                  router,
                                  () =>
                                    TrainingController.getInstance().startTrainingComponent(
                                      training.id,
                                      component.id
                                    ),
                                  () => {
                                    toast.success(
                                      'Component started successfully.'
                                    );
                                  },
                                  undefined,
                                  'Failed to start component.'
                                );
                              }}
                              sx={{ p: 0, m: 0 }}
                            >
                              <PlayCircleOutline fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Stop Training">
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();

                                if (!training || !component) return;

                                handleApiRequest(
                                  router,
                                  () =>
                                    TrainingController.getInstance().completeTrainingComponent(
                                      training.id,
                                      component.id
                                    ),
                                  () => {
                                    toast.success(
                                      'Component stopped successfully.'
                                    );
                                  },
                                  undefined,
                                  'Failed to stop component.'
                                );
                              }}
                              sx={{ p: 0, m: 0 }}
                            >
                              <StopCircleOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Create Station">
                            <IconButton
                              sx={{ p: 0, m: 0 }}
                              onClick={async (e) => {
                                e.stopPropagation();

                                if (!training || !component) return;

                                handleApiRequest(
                                  router,
                                  () =>
                                    TrainingController.getInstance().startTrainingComponent(
                                      training.id,
                                      component.id
                                    ),
                                  () => {
                                    router.push(
                                      `/training/${training.id}/component/${component.id}/station`
                                    );
                                  },
                                  undefined,
                                  'Failed to create station.'
                                );
                              }}
                            >
                              <Dock fontSize="small" />
                            </IconButton>
                          </Tooltip>
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
