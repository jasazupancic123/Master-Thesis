import {
  ArrowDropDown,
  ArrowDropUp,
  ArrowForwardRounded,
  MoreVert,
} from '@mui/icons-material';
import { Box, Divider, IconButton } from '@mui/material';
import { useTheme } from '@mui/material';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

import AthleteTrainingComponents from '../athlete-training-components/athlete-training-components';
import ComponentsAvatar from '../components-avatar/components-avatar';
import { TrainingService } from '@/controller/training/training.service';
import type { Superset } from '@/controller/training/type/superset.type';
import type { Training } from '@/controller/training/type/training.type';
import type { TrainingComponent } from '@/controller/training/type/training-component.type';
import { useAuthenticatedAuth } from '@/store/auth.provider';
import { useTraining } from '@/store/training.provider';

type AthleteTrainingCardProps = {
  training: Training;
};

const TIMEOUT = 400; // ms

export default function AthleteTrainingCard(props: AthleteTrainingCardProps) {
  const { trainingInProgress } = useTraining();
  const { user } = useAuthenticatedAuth();

  const theme = useTheme();

  const { training } = props;

  const [modal, setModal] = useState(false);
  const [_supersets, setSupersets] = useState<Superset[]>();
  const [selectedComponent, setSelectedComponent] =
    useState<TrainingComponent | null>(null);
  const [components, _setComponents] = useState<TrainingComponent[]>([
    training.warmup,
    ...training.components,
    training.cooldown,
  ]);
  const [showSupersets, setShowSupersets] = useState(false);

  useEffect(() => {
    if (!trainingInProgress || !trainingInProgress.selectedComponent) return;

    setSupersets(
      TrainingService.getSupersetsByAthlete(
        user.uid,
        training.components.find(
          (c) => c.id === trainingInProgress.selectedComponent?.id
        ) || trainingInProgress.selectedComponent!
      )
    );
  }, [
    user.uid,
    training.components,
    trainingInProgress,
    trainingInProgress?.selectedComponent,
  ]);

  const getDurationText = () => {
    const from = new Date(training.from);
    const to = new Date(training.to);

    const durationMs = to.getTime() - from.getTime();
    const totalMinutes = Math.floor(durationMs / 1000 / 60);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const durationText = `${hours > 0 ? `${hours}h ` : ''}${minutes}min`;
    return durationText;
  };

  const getNumExercises = (userId: string) => {
    return components.reduce(
      (acc, component) =>
        acc +
        TrainingService.getSupersetsByAthlete(userId, component)
          .map((s) => s.exercises.length)
          .reduce((a, b) => a + b, 0),
      0
    );
  };

  const checkIsActiveTraining = () => {
    const now = dayjs();
    const from = dayjs(training.from);

    const isNowAM = now.hour() < 12;
    const isTrainingAM = from.hour() < 12;

    return isNowAM === isTrainingAM && now.isSame(from, 'day');
  };

  const isActiveTraining = checkIsActiveTraining();

  return (
    <>
      <Box
        width="100%"
        display="flex"
        flexDirection="column"
        sx={{
          px: 2,
          py: 2,
          backgroundColor: theme.palette.background.default,
          border: isActiveTraining
            ? `1px solid ${theme.palette.primary.main}`
            : 'none',
          position: isActiveTraining ? 'relative' : undefined,
        }}
        gap={1.5}
      >
        {isActiveTraining && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: theme.palette.primary.main,
              borderBottomLeftRadius: 40,
              borderBottomRightRadius: 40,
              px: 2,
              zIndex: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: theme.palette.background.light,
              }}
            >
              Active
            </Typography>
          </Box>
        )}

        <Box
          width="100%"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          gap={1}
        >
          {/* Group name, cycle name, date */}
          <Box display="flex" alignItems="center" gap={1}>
            <ComponentsAvatar size={50} components={training.components} />
            <Box display="flex" flexDirection="column">
              <Typography
                sx={{
                  fontWeight: 'bold',
                  fontSize: 15,
                  height: 20,
                }}
              >
                {training.group?.name}
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  height: 16,
                }}
              >
                {training.cycle?.name}
              </Typography>
              <Typography sx={{ fontSize: 12, height: 16 }}>
                {new Date(training.from).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                at{' '}
                {new Date(training.from).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: 'numeric',
                })}
              </Typography>
            </Box>
          </Box>
          <IconButton sx={{ p: 0, m: 0 }}>
            <MoreVert />
          </IconButton>{' '}
        </Box>

        {/* Training data info */}
        <Box
          width="100%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          gap={2}
        >
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            textAlign="center"
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 350,
              }}
            >
              Duration
            </Typography>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 'bold',
              }}
            >
              {getDurationText()}
            </Typography>
          </Box>

          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            textAlign="center"
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 350,
              }}
            >
              Exercises
            </Typography>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 'bold',
              }}
            >
              {getNumExercises(user.uid)}
            </Typography>
          </Box>
        </Box>

        {/* Training components */}
        <AthleteTrainingComponents
          training={training}
          components={components}
          selectedComponent={selectedComponent}
          setSelectedComponent={setSelectedComponent}
          showSupersets={showSupersets}
          setShowSupersets={setShowSupersets}
          modal={modal}
          setModal={setModal}
          timeout={TIMEOUT}
        />

        {/* Expanded/Collapsed */}
        <Box width="100%" sx={{ position: 'relative' }}>
          <Box
            width="40px"
            height="20px"
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
              mx: 'auto',
              backgroundColor: theme.palette.background.dark,
            }}
          >
            <IconButton
              sx={{ p: 0, m: 0 }}
              onClick={() => {
                if (!selectedComponent && components.length) {
                  setShowSupersets(true);
                  setSelectedComponent(components[0]);
                } else {
                  setShowSupersets(false);
                  setTimeout(() => {
                    setSelectedComponent(null);
                  }, TIMEOUT);
                }
              }}
            >
              {!showSupersets ? <ArrowDropDown /> : <ArrowDropUp />}
            </IconButton>
          </Box>
          {selectedComponent &&
            showSupersets &&
            user &&
            dayjs(training.from).isSame(new Date(), 'day') && (
              <IconButton
                sx={{
                  p: 0.5,
                  m: 0,
                  position: 'absolute',
                  right: 0,
                  bottom: -6,
                  backgroundColor: theme.palette.primary.main,
                }}
                onClick={() => {
                  setModal(true);
                }}
              >
                <ArrowForwardRounded fontSize="small" />
              </IconButton>
            )}
        </Box>
      </Box>
      <Divider
        sx={{
          mx: 2,
        }}
      />
    </>
  );
}
