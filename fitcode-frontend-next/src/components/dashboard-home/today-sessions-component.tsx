import { theme } from '@/app/style';
import { TrainingStatus } from '@/core/training/enum/training-status.enum';
import { TrainingComponent } from '@/core/training/type/training-component.type';
import { Training } from '@/core/training/type/training.type';
import { lib } from '@/lib';
import { SetState } from '@/lib/common/type/state.type';
import { useMain } from '@/store/main.provider';
import { useTrainings } from '@/store/trainings.provider';
import { Check, Circle, Pause } from '@mui/icons-material';
import { alpha, Box, SvgIcon, Typography } from '@mui/material';
import dayjs from 'dayjs';

interface Props {
  component: TrainingComponent & { groupId?: string; trainingId: string };
  trainings: Training[];
  index: number;
  setSelectedTraining?: SetState<Training | null>;
  setSelectedTrainingComponent?: SetState<TrainingComponent | null>;
  setOpenTrainingComponentModal?: SetState<boolean>;
}

export default function TodaySessionsComponent(props: Props) {
  const { activeTraining, groups } = useMain();
  const trainingsContext = useTrainings();

  const {
    component,
    trainings,
    index,
    setSelectedTraining,
    setSelectedTrainingComponent,
    setOpenTrainingComponentModal,
  } = props;

  const training = trainings.find((t) => t.id === component.trainingId);

  if (!training) return null;

  const IconComponent = lib.common.component.getIcon(component.id);

  const group = groups.find((g) => g.id === component.groupId);

  let componentStatus = activeTraining?.statuses?.find(
    (s) => s.componentId === component.id && s.trainingId === training.id
  )?.status;

  if (!componentStatus) {
    const isTrainingWithStatuses =
      lib.common.typeChecker.isTrainingWithStatuses(training);

    if (isTrainingWithStatuses) {
      componentStatus = training.statuses?.find(
        (s) => s.componentId === component.id && s.trainingId === training.id
      )?.status;
    }
  }

  return (
    <Box
      key={`${component.id}-${index}`}
      width="100%"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      onClick={() => {
        // display training details modal for athlete

        if (
          !setSelectedTraining ||
          !setSelectedTrainingComponent ||
          !setOpenTrainingComponentModal
        )
          return;

        if (!trainingsContext) return;

        if (!training) return;

        setSelectedTraining(training);
        setSelectedTrainingComponent(component);
        setOpenTrainingComponentModal(true);
      }}
    >
      <Box display="flex" alignItems="center" gap={1}>
        {IconComponent && (
          <SvgIcon
            component={IconComponent as React.ElementType} // handles SvgIconComponent or your SvgC
            inheritViewBox
            sx={{
              fontSize: 20,
              color: theme.palette.text.primary,
              // force shapes inside the svg to use currentColor
              '& path, & rect, & circle, & polygon, & ellipse, & line, & polyline':
                {
                  fill: 'currentColor',
                  stroke: 'currentColor',
                },
            }}
          />
        )}
        <Box display="flex" flexDirection="column" gap={0.5}>
          <Typography
            lineHeight={1}
            fontSize={16}
            sx={{ textTransform: 'uppercase' }}
          >
            {component.id}
          </Typography>
          <Typography
            lineHeight={1}
            fontSize={12}
            color={alpha(theme.palette.text.primary, 0.5)}
          >
            {group?.name}
          </Typography>
        </Box>
      </Box>
      {componentStatus === TrainingStatus.PAUSED && (
        <Pause
          sx={{
            color: theme.palette.error.main,
            fontSize: 12,
          }}
        />
      )}

      {componentStatus === TrainingStatus.IN_PROGRESS && (
        <Circle
          sx={{
            color: theme.palette.primary.main,
            fontSize: 12,
          }}
        />
      )}

      {componentStatus === TrainingStatus.COMPLETED && (
        <Check
          sx={{
            color: theme.palette.success.main,
            fontSize: 16,
          }}
        />
      )}
      <Box display="flex" justifyContent="flex-end">
        <Typography fontSize={12}>
          {dayjs(component.from).format('HH:mm')}
        </Typography>
      </Box>
    </Box>
  );
}
