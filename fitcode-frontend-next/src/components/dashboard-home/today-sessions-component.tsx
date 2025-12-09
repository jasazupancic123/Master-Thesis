import {
  Check,
  Circle,
  KeyboardArrowUpOutlined,
  Pause,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Collapse,
  IconButton,
  SvgIcon,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { startTrainingComponent } from '../athlete/actions/actions-training-component';
import { theme } from '@/app/style';
import { TrainingStatus } from '@/core/training/enum/training-status.enum';
import type { Training } from '@/core/training/type/training.type';
import type { TrainingComponent } from '@/core/training/type/training-component.type';
import { lib } from '@/lib';
import { EXERCISE_DEFAULT_IMG_URL } from '@/lib/common/const/image.const';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useMain } from '@/store/main.provider';
import { useTrainings } from '@/store/trainings.provider';

interface Props {
  component: TrainingComponent & { groupId?: string; trainingId: string };
  trainings: Training[];
  index: number;
}

export default function TodaySessionsComponent(props: Props) {
  const router = useRouter();

  const { user } = useAuthenticatedAuth();
  const mainContext = useMain();

  const { activeTraining, institution } = mainContext;
  const trainingsContext = useTrainings();

  const { component, trainings, index } = props;

  const [open, setOpen] = useState(false);

  const hasPlayedAudioRef = useRef(false);

  const training = trainings.find((t) => t.id === component.trainingId);

  if (!training) return null;

  const IconComponent = lib.common.component.getIcon(component.id);

  const group = institution.groups?.find((g) => g.id === component.groupId);

  const hasGotWarmup = component.supersets.some((s) => s.warmup);

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

  const subgroups = component.subgroups.filter((sg) =>
    sg.membersIds.includes(user.uid)
  );
  const virtualSubgroup = subgroups.find((sg) => sg.parentId);
  const subgroup = virtualSubgroup || subgroups[0];

  const supersets = (subgroup || component).supersets;

  return (
    <Box
      key={`${component.id}-${index}`}
      width="100%"
      display="flex"
      flexDirection="column"
    >
      <Box
        width="100%"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        onClick={() => {
          // expand training details  for athlete

          if (!trainingsContext) return;

          if (!training) return;

          setOpen((prev) => !prev);
        }}
      >
        <Box display="flex" alignItems="center" gap={1} mt={2}>
          {IconComponent && (
            <SvgIcon
              component={IconComponent as React.ElementType} // handles SvgIconComponent or your SvgC
              sx={{
                width: 28,
                fontSize: 20,
                mb: 0.5,
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
          {!open ? (
            <Typography fontSize={12}>
              {dayjs(component.from).format('HH:mm')}
            </Typography>
          ) : (
            <Button
              size="small"
              variant="contained"
              onClick={async (e) => {
                e.stopPropagation();
                await startTrainingComponent(
                  {
                    useMain: mainContext,
                    useTrainings: trainingsContext,
                  },
                  {
                    user,
                    training,
                    selectedComponent: component,
                    setOpen,
                    hasPlayedAudioRef,
                    router,
                  }
                );
              }}
            >
              Start
            </Button>
          )}
        </Box>
      </Box>
      <Collapse in={open} timeout={500} unmountOnExit sx={{ mt: 2 }}>
        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          gap={4}
          mt={1}
          sx={{
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0)' : 'translateY(-4px)',
            transition: 'opacity 300ms ease, transform 300ms ease',
          }}
        >
          {supersets.map((superset, i) => (
            <Box
              key={`superset-${i}`}
              width="100%"
              display="flex"
              flexDirection="column"
              gap={1}
            >
              <Typography
                sx={{ color: theme.palette.primary.main }}
                fontWeight={500}
              >
                {superset.warmup
                  ? 'Warmup'
                  : superset.cooldown
                    ? 'Cooldown'
                    : `Block ${hasGotWarmup ? -1 : 0 + i + 1}`}
              </Typography>
              {superset.exercises.map((exercise) => {
                const exerciseObject = exercise.exercise;

                return (
                  <Box
                    key={exercise.id}
                    width="100%"
                    display="flex"
                    alignItems="center"
                    sx={{
                      filter: 'grayscale(100%)',
                    }}
                    gap={0.5}
                  >
                    <Box
                      width="100%"
                      display="flex"
                      alignItems="center"
                      maxWidth={80}
                      sx={{
                        filter: 'grayscale(100%)',
                      }}
                    >
                      {exercise.exercise?.imageUrl ||
                      !exercise.exercise?.videoUrl ? (
                        <Image
                          src={
                            exerciseObject?.imageUrl || EXERCISE_DEFAULT_IMG_URL
                          }
                          alt={exerciseObject?.name || 'Unknown Exercise'}
                          width={80}
                          height={0}
                          layout="intrinsic"
                          unoptimized={lib.common.env.unoptimizeImages()}
                          style={{
                            objectFit: 'contain',
                            display: 'block',
                            borderRadius: 2,
                          }}
                        />
                      ) : (
                        <Box
                          component="video"
                          sx={{
                            inset: 0,
                            width: 80,
                            height: '100%',
                            objectFit: 'contain',
                            borderRadius: 2,
                          }}
                          controls={false}
                          src={exerciseObject?.videoUrl}
                          muted
                          loop
                          playsInline
                        />
                      )}
                    </Box>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="flex-start"
                      justifyContent="center"
                    >
                      <Typography>
                        {exerciseObject?.name || 'Unknown Exercise'}
                      </Typography>
                      <Typography fontSize={12}>
                        {exercise.sets.length} sets
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ))}
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            sx={{
              p: 0.25,
              px: 2,
              m: 0,
              backgroundColor: theme.palette.background.dark,
              borderRadius: 2,
              alignSelf: 'center',
              transition: 'transform 200ms ease',
              transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
            }}
          >
            <KeyboardArrowUpOutlined fontSize="small" />
          </IconButton>
        </Box>
      </Collapse>
    </Box>
  );
}
