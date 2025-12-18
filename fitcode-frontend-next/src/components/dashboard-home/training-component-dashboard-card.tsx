import {
  Dock,
  EditNote,
  PlayCircleOutline,
  StopCircleOutlined,
} from '@mui/icons-material';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { theme } from '@/app/style';
import { TrainingController } from '@/core/training/training.controller';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import { handleApiRequest } from '@/lib/common/type/state.type';
import { useMain } from '@/store/main.provider';

interface Props {
  component: TrainingComponent & {
    groupId: string | undefined;
    trainingId: string;
  };
}

export default function TrainingComponentDashboardCard(props: Props) {
  const router = useRouter();

  const { institution, trainings } = useMain();

  const { component } = props;

  const periodLabel =
    dayjs(component.from).hour() < 12
      ? 'Morning'
      : dayjs(component.from).hour() < 18
        ? 'Afternoon'
        : 'Evening';

  const group = institution.groups.find((g) => g.id === component.groupId);
  const training = trainings.data.find((t) => t.id === component.trainingId);

  if (!training || !group) return null;

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      sx={{
        border: `1px solid ${theme.palette.background.lightBorder}`,
        borderRadius: 2,
        p: 2,
      }}
      gap={2}
    >
      <Typography variant="subtitle2" fontSize={12}>
        {periodLabel}, {dayjs(component.from).format('H:mm')}
      </Typography>
      <Typography
        variant="h6"
        fontWeight={600}
        sx={{
          textTransform: 'uppercase',
        }}
      >
        {group.shortName} - {component.id}{' '}
        {component.targetId ? `- ${component.targetId}` : ''}
      </Typography>
      <Box width="100%" display="flex" justifyContent="flex-end" gap={1}>
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
                  toast.success('Component started successfully.');
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
                  toast.success('Component stopped successfully.');
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
      </Box>
    </Box>
  );
}
