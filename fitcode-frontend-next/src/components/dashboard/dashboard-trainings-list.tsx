import { theme } from '@/app/style';
import { Targets } from '@/core/exercise/constant/target.constant';
import { Group } from '@/core/group/type/group.type';
import { Training } from '@/core/training/type/training.type';
import { styledScrollbarSx } from '@/lib/common/style/scrollbar';
import { useMain } from '@/store/main.provider';
import {
  Circle,
  EditOutlined,
  PlayCircleOutline,
  Visibility,
} from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { Fragment } from 'react';
import useFilteredTrainingsList from './hooks/use-filtered-trainings-list';

interface Props {
  trainings: Training[];
  selectedGroups: Group[];
  upcoming?: boolean; // if true, then completed trainings were passed, if false, then upcoming
}

export default function DashboardTrainingsList(props: Props) {
  const { groups } = useMain();

  const { trainings, selectedGroups, upcoming } = props;

  const { filteredTrainings } = useFilteredTrainingsList(
    trainings,
    selectedGroups
  );

  return (
    <Box
      width="100%"
      maxHeight="60vh"
      display="flex"
      flexDirection="column"
      sx={{
        overflowY: 'auto',
        pr: 0.5,
        ...styledScrollbarSx(theme),
      }}
      gap={2}
    >
      {filteredTrainings.map((training) => {
        const group = groups.find((g) => g.id === training.groupId);

        if (!group) return null;

        const shortGroupName = group.name.substring(0, 3);

        return (
          <Fragment key={training.id}>
            {training.components.map((component) => {
              const target = Targets.find(
                (t) =>
                  t.field === component.targetId &&
                  t.componentId === component.id
              );

              const trainingName = `${shortGroupName} - ${component.id}${target ? ` - ${target.name}` : ''}`;

              const periodLabel =
                new Date(training.from).getHours() < 12
                  ? 'Morning'
                  : 'Afternoon';

              const time = dayjs(training.from).format('HH:mm');
              const timeLabel = `${periodLabel}, ${time}`;

              const isToday = dayjs(training.from).isSame(dayjs(), 'day');
              const dateLabel = isToday
                ? 'Today'
                : dayjs(training.from).format('D-MMM');

              return (
                <Box
                  key={`${training.id}-${component.id}`}
                  width="100%"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  {upcoming && isToday && (
                    <Circle
                      sx={{
                        color: theme.palette.primary.main,
                        fontSize: 16,
                      }}
                    />
                  )}
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
                    {upcoming && (
                      <Typography
                        fontSize={12}
                        lineHeight={1}
                        sx={{
                          textTransform: 'uppercase',
                        }}
                      >
                        {dateLabel}
                      </Typography>
                    )}
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
