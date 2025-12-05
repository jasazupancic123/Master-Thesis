import { lib } from '@/lib';
import { useCoachTraining } from '@/store/coach-training.provider';
import { useScreenSize } from '@/store/screen-size.provider';
import { useTrainingRecap } from '@/store/training-recap.provider';
import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { usePathname } from 'next/navigation';

export default function TrainingRecapHeader() {
  const pathname = usePathname();
  const screenSize = useScreenSize();

  const { training, group } = useCoachTraining();
  const { workloads } = useTrainingRecap();

  const componentId = pathname.split('/')[4];

  const component = training.components.find((comp) => comp.id === componentId);

  if (!component) return null;

  const uniqueUsers = Array.from(
    new Set(workloads.map((w) => w.userId))
  ).length;

  const uniqueExercises = Array.from(
    new Set(workloads.map((w) => w.exerciseId))
  ).length;

  const IconComponent = lib.common.component.getIcon(componentId);

  const isSmallSize = screenSize.isMobile;

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection={isSmallSize ? 'column' : 'row'}
      alignItems="center"
      justifyContent={isSmallSize ? undefined : 'flex-start'}
      gap={isSmallSize ? 0.5 : 2}
    >
      {IconComponent && (
        <IconComponent style={{ transform: 'translateX(25%)' }} />
      )}
      <Typography variant="h5" fontWeight="bold" textAlign="center">
        {group.name} - {component.id[0].toUpperCase() + component.id.slice(1)} -{' '}
        {dayjs(component.from).format('DD. MMM')}
      </Typography>
      <Typography variant="h6" fontWeight={200} fontSize={20}>
        {uniqueUsers} athletes
      </Typography>
      <Typography variant="h6" fontWeight={200} fontSize={20}>
        {uniqueExercises} exercises
      </Typography>
    </Box>
  );
}
